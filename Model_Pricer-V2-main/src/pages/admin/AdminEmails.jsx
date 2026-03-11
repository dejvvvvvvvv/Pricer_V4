// Admin Email Notifications Configuration Page — V2
// --------------------------------------------------
// Scope: /admin/emails only
// - Single source of truth: tenant-scoped V1 storage (namespace: email:v1 + email-templates:v1)
// - 4 tabs: Triggers, Template Editor, Provider Config, Email Log
// - Triggers: event triggers with enable/disable and subject line
// - Template Editor: visual WYSIWYG-like editor with variable insertion, live preview
// - Provider: SMTP / Resend / SendGrid configuration
// - Log: recent sent emails from localStorage log

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/AppIcon';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  EMAIL_TEMPLATE_TYPES,
  EMAIL_TEMPLATE_VARIABLES,
  getDefaultTemplateContent,
  loadEmailConfigV1,
  loadEmailTemplates,
  renderTemplatePreview,
  sanitizeTemplateHtml,
  saveEmailConfigV1,
  saveEmailTemplates,
} from '../../utils/adminEmailStorage';
import { readTenantJson } from '../../utils/adminTenantStorage';
import EmailTemplatePreview from './components/EmailTemplatePreview';

function createId(prefix = 'trig') {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  } catch {}
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const PROVIDER_OPTIONS = [
  { value: 'none', label_cs: 'Zadny (vypnuto)', label_en: 'None (disabled)' },
  { value: 'smtp', label_cs: 'SMTP', label_en: 'SMTP' },
  { value: 'resend', label_cs: 'Resend', label_en: 'Resend' },
  { value: 'sendgrid', label_cs: 'SendGrid', label_en: 'SendGrid' },
];

const EVENT_LABELS = {
  order_confirmed: { cs: 'Objednavka potvrzena', en: 'Order confirmed' },
  order_printing: { cs: 'Tisk zahajen', en: 'Printing started' },
  order_shipped: { cs: 'Objednavka odeslana', en: 'Order shipped' },
  order_completed: { cs: 'Objednavka dokoncena', en: 'Order completed' },
};

const TABS = [
  { id: 'templates', icon: 'Mail', label_cs: 'Triggery', label_en: 'Triggers' },
  { id: 'editor', icon: 'Paintbrush', label_cs: 'Editor sablon', label_en: 'Template Editor' },
  { id: 'provider', icon: 'Settings', label_cs: 'Provider', label_en: 'Provider' },
  { id: 'log', icon: 'FileText', label_cs: 'Log', label_en: 'Log' },
];

// ---------------------------------------------------------------------------
// Formatting toolbar commands
// ---------------------------------------------------------------------------
const TOOLBAR_ACTIONS = [
  { cmd: 'bold', icon: 'Bold', title_cs: 'Tucne', title_en: 'Bold' },
  { cmd: 'italic', icon: 'Italic', title_cs: 'Kurziva', title_en: 'Italic' },
  { cmd: 'underline', icon: 'Underline', title_cs: 'Podtrzeni', title_en: 'Underline' },
  { cmd: 'sep1' },
  { cmd: 'formatBlock:h2', icon: 'Heading2', title_cs: 'Nadpis', title_en: 'Heading' },
  { cmd: 'formatBlock:p', icon: 'Pilcrow', title_cs: 'Odstavec', title_en: 'Paragraph' },
  { cmd: 'sep2' },
  { cmd: 'insertUnorderedList', icon: 'List', title_cs: 'Seznam', title_en: 'List' },
  { cmd: 'sep3' },
  { cmd: 'createLink', icon: 'Link', title_cs: 'Odkaz', title_en: 'Link' },
  { cmd: 'removeFormat', icon: 'RemoveFormatting', title_cs: 'Smazat formatovani', title_en: 'Remove formatting' },
];

export default function AdminEmails() {
  const { t, language } = useLanguage();
  const cs = language === 'cs';
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
  const editorRef = useRef(null);

  useEffect(() => {
    try {
      const cfg = loadEmailConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));

      const tpls = loadEmailTemplates();
      setTemplates(tpls);
      setTemplatesSavedSnapshot(JSON.stringify(tpls));

      const log = readTenantJson('email-log:v1', []);
      setEmailLog(Array.isArray(log) ? log : []);
      setLoading(false);
    } catch (e) {
      console.error('[AdminEmails] Failed to init', e);
      setLoading(false);
      setBanner({ type: 'error', text: cs ? 'Nepodarilo se nacist konfiguraci.' : 'Failed to load config.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync editor content when switching templates
  useEffect(() => {
    if (editorRef.current && templates[activeTemplate]) {
      editorRef.current.innerHTML = templates[activeTemplate].body || '';
    }
  }, [activeTemplate]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => {
    if (!config) return false;
    return savedSnapshot !== JSON.stringify(config);
  }, [config, savedSnapshot]);

  const templatesDirty = useMemo(() => {
    return templatesSavedSnapshot !== JSON.stringify(templates);
  }, [templates, templatesSavedSnapshot]);

  const ui = useMemo(() => ({
    title: cs ? 'Emailove notifikace' : 'Email Notifications',
    subtitle: cs
      ? 'Nastaveni emailovych triggeru, sablon, providera a historie odeslanych emailu.'
      : 'Configure email triggers, templates, provider settings and sent email history.',
    save: cs ? 'Ulozit' : 'Save',
    saving: cs ? 'Ukladam...' : 'Saving...',
    saved: cs ? 'Ulozeno' : 'Saved',
    unsaved: cs ? 'Neulozene zmeny' : 'Unsaved changes',
  }), [cs]);

  const updateConfig = (patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const updateTrigger = (idx, patch) => {
    setConfig((prev) => {
      const triggers = [...(prev.triggers || [])];
      triggers[idx] = { ...triggers[idx], ...patch };
      return { ...prev, triggers };
    });
  };

  const addTrigger = () => {
    setConfig((prev) => ({
      ...prev,
      triggers: [
        ...(prev.triggers || []),
        { event: `custom_${createId()}`, enabled: false, template_id: '' },
      ],
    }));
  };

  const removeTrigger = (idx) => {
    setConfig((prev) => {
      const triggers = [...(prev.triggers || [])];
      triggers.splice(idx, 1);
      return { ...prev, triggers };
    });
  };

  const updateTemplate = (event, patch) => {
    setConfig((prev) => {
      const tpls = { ...(prev.templates || {}) };
      tpls[event] = { ...(tpls[event] || {}), ...patch };
      return { ...prev, templates: tpls };
    });
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
      const url = prompt(cs ? 'Zadejte URL odkazu:' : 'Enter link URL:', 'https://');
      if (url) {
        document.execCommand('createLink', false, url);
      }
    } else {
      document.execCommand(cmdStr, false, null);
    }
    syncEditorContent();
    // Keep focus in editor
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
    // Move cursor after inserted text
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
    syncEditorContent();
  }, [syncEditorContent]);

  const handleSave = () => {
    setBanner(null);
    try {
      setSaving(true);
      const saved = saveEmailConfigV1(config);
      setConfig(saved);
      setSavedSnapshot(JSON.stringify(saved));
      setSaving(false);
      setBanner({ type: 'success', text: ui.saved });
    } catch (e) {
      console.error('[AdminEmails] Save failed', e);
      setSaving(false);
      setBanner({ type: 'error', text: cs ? 'Ulozeni selhalo.' : 'Save failed.' });
    }
  };

  const handleSaveTemplates = useCallback(() => {
    setBanner(null);
    try {
      setTplSaving(true);
      // Sanitize all template bodies before saving
      const sanitized = {};
      for (const [key, tpl] of Object.entries(templates)) {
        sanitized[key] = {
          ...tpl,
          body: sanitizeTemplateHtml(tpl.body || ''),
        };
      }
      const saved = saveEmailTemplates(sanitized);
      setTemplates(saved);
      setTemplatesSavedSnapshot(JSON.stringify(saved));
      setTplSaving(false);
      setBanner({ type: 'success', text: cs ? 'Sablony ulozeny.' : 'Templates saved.' });
    } catch (e) {
      console.error('[AdminEmails] Template save failed', e);
      setTplSaving(false);
      setBanner({ type: 'error', text: cs ? 'Ulozeni sablon selhalo.' : 'Template save failed.' });
    }
  }, [templates, cs]);

  const handleResetTemplate = useCallback(async () => {
    const ok = await confirm({
      title: cs ? 'Obnovit vychozi sablonu' : 'Reset to default template',
      message: cs ? 'Opravdu chcete obnovit tuto sablonu na vychozi obsah? Neulozen zmeny budou ztraceny.' : 'Reset this template to default content? Unsaved changes will be lost.',
      confirmLabel: cs ? 'Obnovit' : 'Reset',
      destructive: true,
    });
    if (!ok) return;
    const def = getDefaultTemplateContent(activeTemplate);
    updateTemplateContent(activeTemplate, def);
    if (editorRef.current) {
      editorRef.current.innerHTML = def.body || '';
    }
  }, [activeTemplate, confirm, cs, updateTemplateContent]);

  const handleSendTest = useCallback(() => {
    const rendered = renderTemplatePreview(
      templates[activeTemplate]?.body || '',
      templates[activeTemplate]?.subject || ''
    );
    const win = window.open('', '_blank');
    if (!win) {
      setBanner({ type: 'error', text: cs ? 'Prohlizec blokuje vyskakovaci okna.' : 'Browser blocked popup.' });
      return;
    }
    const html = `<!DOCTYPE html>
<html lang="cs"><head><meta charset="utf-8"/><title>Test Email</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 32px; background: #f5f5f5; }
  .wrap { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
  .hdr { background: #1a1a2e; color: #fff; padding: 16px 24px; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; }
  .subj { padding: 16px 24px; border-bottom: 1px solid #e8e8e8; font-size: 18px; font-weight: 600; }
  .body { padding: 24px; line-height: 1.6; }
  .body h2 { margin-bottom: 12px; }
  .body p { margin-bottom: 12px; }
  .body a { color: #00d4aa; }
  .ft { padding: 16px 24px; border-top: 1px solid #e8e8e8; font-size: 12px; color: #999; text-align: center; }
</style></head><body>
<div class="wrap">
  <div class="hdr">Test Email Preview</div>
  <div class="subj">${rendered.subject}</div>
  <div class="body">${rendered.body}</div>
  <div class="ft">Toto je testovaci nahled emailu.</div>
</div></body></html>`;
    win.document.write(html);
    win.document.close();
  }, [activeTemplate, templates, cs]);

  const handleReset = async () => {
    const ok = await confirm({ title: cs ? 'Zahodit zmeny' : 'Discard changes', message: cs ? 'Zahodit zmeny?' : 'Discard changes?', confirmLabel: cs ? 'Zahodit' : 'Discard', destructive: true });
    if (!ok) return;
    try {
      const cfg = loadEmailConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      setBanner({ type: 'success', text: cs ? 'Obnoveno.' : 'Reset done.' });
    } catch (e) {
      setBanner({ type: 'error', text: cs ? 'Reset selhal.' : 'Reset failed.' });
    }
  };

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

  const triggers = config?.triggers || [];
  const configTemplates = config?.templates || {};
  const provider = config?.provider || 'none';
  const currentTpl = templates[activeTemplate] || { subject: '', body: '' };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>{ui.title}</h1>
          <p className="subtitle">{ui.subtitle}</p>
        </div>
        <div className="header-actions">
          {activeTab !== 'editor' && (
            <>
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
            </>
          )}
          {activeTab === 'editor' && (
            <>
              <div className={`status-pill ${templatesDirty ? 'dirty' : 'clean'}`}>
                <Icon name={templatesDirty ? 'AlertCircle' : 'CheckCircle2'} size={16} />
                <span>{templatesDirty ? ui.unsaved : ui.saved}</span>
              </div>
              <button className="btn-secondary" onClick={handleResetTemplate}>
                <Icon name="RotateCcw" size={18} />
                {cs ? 'Vychozi' : 'Default'}
              </button>
              <button className="btn-primary" onClick={handleSaveTemplates} disabled={!templatesDirty || tplSaving}>
                <Icon name="Save" size={18} />
                {tplSaving ? ui.saving : ui.save}
              </button>
            </>
          )}
        </div>
      </div>

      {banner && (
        <div className={`banner ${banner.type}`}>
          <Icon name={banner.type === 'error' ? 'XCircle' : 'CheckCircle2'} size={18} />
          <span>{banner.text}</span>
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} size={16} />
            <span>{cs ? tab.label_cs : tab.label_en}</span>
          </button>
        ))}
      </div>

      {/* TAB: TRIGGERS */}
      {activeTab === 'templates' && (
        <div className="tab-content">
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{cs ? 'Emailove triggery' : 'Email triggers'}</h2>
                <p className="card-description">
                  {cs
                    ? 'Kazdemu eventu muzes priradit sablonu a zapnout/vypnout odesilani.'
                    : 'Assign a template to each event and enable/disable sending.'}
                </p>
              </div>
              <button className="btn-secondary" onClick={addTrigger}>
                <Icon name="Plus" size={18} />
                {cs ? 'Pridat trigger' : 'Add trigger'}
              </button>
            </div>
            <div className="card-body">
              {triggers.length === 0 ? (
                <div className="empty-state">
                  <Icon name="Mail" size={44} />
                  <h3>{cs ? 'Zadne triggery' : 'No triggers'}</h3>
                  <p>{cs ? 'Pridej emailovy trigger.' : 'Add an email trigger.'}</p>
                </div>
              ) : (
                <div className="trigger-list">
                  {triggers.map((trigger, idx) => {
                    const eventLabel = EVENT_LABELS[trigger.event];
                    const tpl = configTemplates[trigger.event] || {};
                    return (
                      <div key={`${trigger.event}_${idx}`} className="trigger-row">
                        <div className="trigger-header">
                          <div className="trigger-left">
                            <ForgeCheckbox
                              checked={trigger.enabled}
                              onChange={(e) => updateTrigger(idx, { enabled: e.target.checked })}
                              label={<span className="trigger-event-name">{eventLabel ? (cs ? eventLabel.cs : eventLabel.en) : trigger.event}</span>}
                            />
                            <span className="muted">{trigger.event}</span>
                          </div>
                          <button className="icon-btn" title={cs ? 'Smazat' : 'Remove'} onClick={() => removeTrigger(idx)}>
                            <Icon name="Trash2" size={14} />
                          </button>
                        </div>
                        <div className="trigger-fields">
                          <div className="field">
                            <label htmlFor={`tpl-id-${idx}`}>{cs ? 'Template ID' : 'Template ID'}</label>
                            <input
                              id={`tpl-id-${idx}`}
                              className="input"
                              value={trigger.template_id}
                              onChange={(e) => updateTrigger(idx, { template_id: e.target.value })}
                              placeholder={cs ? 'Napr. order_confirmed' : 'e.g. order_confirmed'}
                            />
                          </div>
                          <div className="field">
                            <label htmlFor={`tpl-subj-${idx}`}>{cs ? 'Predmet (Subject)' : 'Subject'}</label>
                            <input
                              id={`tpl-subj-${idx}`}
                              className="input"
                              value={tpl.subject || ''}
                              onChange={(e) => updateTemplate(trigger.event, { subject: e.target.value })}
                              placeholder={cs ? 'Predmet emailu...' : 'Email subject...'}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: TEMPLATE EDITOR */}
      {activeTab === 'editor' && (
        <div className="tab-content">
          {/* Template selector */}
          <div className="tpl-selector">
            {EMAIL_TEMPLATE_TYPES.map((tType) => (
              <button
                key={tType.id}
                className={`tpl-selector-btn ${activeTemplate === tType.id ? 'active' : ''}`}
                onClick={() => setActiveTemplate(tType.id)}
              >
                <Icon name={tType.icon} size={16} />
                <span>{cs ? tType.label_cs : tType.label_en}</span>
              </button>
            ))}
          </div>

          <div className="tpl-editor-layout">
            {/* Editor panel */}
            <div className="tpl-editor-panel">
              <div className="admin-card">
                <div className="card-header">
                  <div>
                    <h2>{cs ? 'Uprava sablony' : 'Edit Template'}</h2>
                    <p className="card-description">
                      {cs
                        ? 'Upravte predmet a telo emailu. Pouzijte promenne pro dynamicky obsah.'
                        : 'Edit subject and body. Use variables for dynamic content.'}
                    </p>
                  </div>
                  <button className="btn-secondary" onClick={handleSendTest} title={cs ? 'Otevrit nahled v novem okne' : 'Open preview in new window'}>
                    <Icon name="ExternalLink" size={16} />
                    {cs ? 'Test nahled' : 'Test Preview'}
                  </button>
                </div>
                <div className="card-body">
                  {/* Subject line */}
                  <div className="field" style={{ marginBottom: 16 }}>
                    <label htmlFor="tpl-editor-subject">{cs ? 'Predmet emailu' : 'Email subject'}</label>
                    <input
                      id="tpl-editor-subject"
                      className="input"
                      value={currentTpl.subject || ''}
                      onChange={(e) => updateTemplateContent(activeTemplate, { subject: e.target.value })}
                      placeholder={cs ? 'Predmet emailu...' : 'Email subject...'}
                    />
                  </div>

                  {/* Variable chips */}
                  <div className="field" style={{ marginBottom: 12 }}>
                    <label>{cs ? 'Vlozit promennou' : 'Insert variable'}</label>
                    <div className="var-chips">
                      {EMAIL_TEMPLATE_VARIABLES.map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          className="var-chip"
                          onClick={() => insertVariable(v.key)}
                          title={`{{${v.key}}} — ${cs ? v.label_cs : v.label_en}`}
                        >
                          <span className="var-chip-key">{`{{${v.key}}}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formatting toolbar */}
                  <div className="editor-toolbar" role="toolbar" aria-label={cs ? 'Formatovani' : 'Formatting'}>
                    {TOOLBAR_ACTIONS.map((action) => {
                      if (action.cmd.startsWith('sep')) {
                        return <div key={action.cmd} className="toolbar-sep" />;
                      }
                      return (
                        <button
                          key={action.cmd}
                          type="button"
                          className="toolbar-btn"
                          title={cs ? action.title_cs : action.title_en}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent losing focus from editor
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
                    className="tpl-editor-body"
                    contentEditable
                    role="textbox"
                    aria-label={cs ? 'Telo emailu' : 'Email body'}
                    aria-multiline="true"
                    onInput={syncEditorContent}
                    onBlur={syncEditorContent}
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: currentTpl.body || '' }}
                  />

                  {/* HTML source hint */}
                  <div className="help" style={{ marginTop: 8 }}>
                    <Icon name="Info" size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {cs
                      ? 'Promenne ve formatu {{nazev}} budou nahrazeny skutecnymi hodnotami pri odeslani.'
                      : 'Variables in {{name}} format will be replaced with actual values when sent.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview panel */}
            <div className="tpl-preview-panel">
              <EmailTemplatePreview
                subject={currentTpl.subject || ''}
                body={currentTpl.body || ''}
                cs={cs}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB: PROVIDER */}
      {activeTab === 'provider' && (
        <div className="tab-content">
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{cs ? 'Nastaveni providera' : 'Provider settings'}</h2>
                <p className="card-description">
                  {cs
                    ? 'Vyber emailoveho poskytovatele a nastav prihlasovaci udaje.'
                    : 'Select email provider and configure credentials.'}
                </p>
              </div>
            </div>
            <div className="card-body">
              <div className="grid2">
                <div className="field">
                  <label htmlFor="provider-select">{cs ? 'Provider' : 'Provider'}</label>
                  <select
                    id="provider-select"
                    className="input"
                    value={provider}
                    onChange={(e) => updateConfig({ provider: e.target.value })}
                  >
                    {PROVIDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{cs ? o.label_cs : o.label_en}</option>
                    ))}
                  </select>
                </div>
              </div>

              {provider === 'smtp' && (
                <div style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--forge-text-primary)', marginBottom: 12, fontFamily: 'var(--forge-font-heading)' }}>
                    {cs ? 'SMTP nastaveni' : 'SMTP settings'}
                  </h3>
                  <div className="grid2">
                    <div className="field">
                      <label htmlFor="smtp-host">{cs ? 'Host' : 'Host'}</label>
                      <input
                        id="smtp-host"
                        className="input"
                        value={config?.smtp_host || ''}
                        onChange={(e) => updateConfig({ smtp_host: e.target.value })}
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="smtp-port">{cs ? 'Port' : 'Port'}</label>
                      <input
                        id="smtp-port"
                        className="input"
                        type="number"
                        value={config?.smtp_port || 587}
                        onChange={(e) => updateConfig({ smtp_port: Number(e.target.value) || 587 })}
                        placeholder="587"
                      />
                    </div>
                  </div>
                  <div className="grid2" style={{ marginTop: 12 }}>
                    <div className="field">
                      <label htmlFor="smtp-user">{cs ? 'Uzivatel' : 'Username'}</label>
                      <input
                        id="smtp-user"
                        className="input"
                        value={config?.smtp_user || ''}
                        onChange={(e) => updateConfig({ smtp_user: e.target.value })}
                        placeholder={cs ? 'Uzivatelske jmeno' : 'Username'}
                      />
                    </div>
                    <div className="field">
                      <label>{cs ? 'Heslo' : 'Password'}</label>
                      <div className="security-note">
                        <Icon name="ShieldAlert" size={16} />
                        <span>{cs ? 'Heslo se nastavuje v .env souboru na serveru (nikdy ne v prohlizeci).' : 'Password is set in .env file on server (never in browser).'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(provider === 'resend' || provider === 'sendgrid') && (
                <div style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--forge-text-primary)', marginBottom: 12, fontFamily: 'var(--forge-font-heading)' }}>
                    {provider === 'resend' ? 'Resend' : 'SendGrid'} {cs ? 'nastaveni' : 'settings'}
                  </h3>
                  <div className="field">
                    <label htmlFor="api-key-name">{cs ? 'API klic (nazev)' : 'API key (name)'}</label>
                    <input
                      id="api-key-name"
                      className="input"
                      value={config?.api_key_name || ''}
                      onChange={(e) => updateConfig({ api_key_name: e.target.value })}
                      placeholder={cs ? 'Napr. RESEND_API_KEY' : 'e.g. RESEND_API_KEY'}
                    />
                    <div className="help">
                      {cs
                        ? 'Samotny API klic patri do .env souboru na serveru. Zde uloz pouze nazev env promenne.'
                        : 'The actual API key belongs in .env on the server. Store only the env variable name here.'}
                    </div>
                  </div>
                </div>
              )}

              {provider !== 'none' && (
                <div style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--forge-text-primary)', marginBottom: 12, fontFamily: 'var(--forge-font-heading)' }}>
                    {cs ? 'Odesilatel' : 'Sender'}
                  </h3>
                  <div className="grid2">
                    <div className="field">
                      <label htmlFor="sender-name">{cs ? 'Jmeno odesilatele' : 'Sender name'}</label>
                      <input
                        id="sender-name"
                        className="input"
                        value={config?.sender_name || ''}
                        onChange={(e) => updateConfig({ sender_name: e.target.value })}
                        placeholder={cs ? 'Napr. ModelPricer' : 'e.g. ModelPricer'}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="sender-email">{cs ? 'Email odesilatele' : 'Sender email'}</label>
                      <input
                        id="sender-email"
                        className="input"
                        type="email"
                        value={config?.sender_email || ''}
                        onChange={(e) => updateConfig({ sender_email: e.target.value })}
                        placeholder="noreply@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: LOG */}
      {activeTab === 'log' && (
        <div className="tab-content">
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{cs ? 'Historie emailu' : 'Email log'}</h2>
                <p className="card-description">
                  {cs
                    ? 'Posledni odeslane emaily (ulozeno v localStorage).'
                    : 'Recent sent emails (stored in localStorage).'}
                </p>
              </div>
            </div>
            <div className="card-body">
              {emailLog.length === 0 ? (
                <div className="empty-state">
                  <Icon name="Inbox" size={44} />
                  <h3>{cs ? 'Zadne zaznamy' : 'No records'}</h3>
                  <p>{cs ? 'Zatim nebyly odeslany zadne emaily.' : 'No emails have been sent yet.'}</p>
                </div>
              ) : (
                <div className="log-table">
                  <div className="log-header">
                    <span>{cs ? 'Datum' : 'Date'}</span>
                    <span>{cs ? 'Prijemce' : 'Recipient'}</span>
                    <span>{cs ? 'Predmet' : 'Subject'}</span>
                    <span>{cs ? 'Stav' : 'Status'}</span>
                    <span>{cs ? 'Trigger' : 'Trigger'}</span>
                  </div>
                  {emailLog.map((entry, idx) => (
                    <div key={idx} className="log-row">
                      <span className="log-date">{entry.date ? new Date(entry.date).toLocaleString(cs ? 'cs-CZ' : 'en-US') : '\u2014'}</span>
                      <span className="log-recipient">{entry.recipient || '\u2014'}</span>
                      <span className="log-subject">{entry.subject || '\u2014'}</span>
                      <span className={`log-status ${entry.status === 'sent' ? 'sent' : 'failed'}`}>
                        <Icon name={entry.status === 'sent' ? 'CheckCircle2' : 'XCircle'} size={14} />
                        {entry.status || '\u2014'}
                      </span>
                      <span className="log-trigger">{entry.event || '\u2014'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-page {
          padding: 24px;
          max-width: 1320px;
          margin: 0 auto;
          background: var(--forge-bg-void);
          min-height: 100vh;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 14px;
        }

        h1 { margin: 0; font-size: 28px; font-weight: 600; color: var(--forge-text-primary); font-family: var(--forge-font-heading); }
        .subtitle { margin: 4px 0 0 0; color: var(--forge-text-secondary); font-size: 14px; max-width: 760px; }

        .header-actions {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end;
        }

        .status-pill {
          display: inline-flex; align-items: center; gap: 6px; border-radius: 999px;
          padding: 6px 10px; font-size: 12px; border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated); color: var(--forge-text-secondary);
          font-family: var(--forge-font-tech);
        }
        .status-pill.clean { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .status-pill.dirty { border-color: rgba(255,181,71,0.3); background: rgba(255,181,71,0.08); color: var(--forge-warning); }

        .btn-primary {
          background: var(--forge-accent-primary); color: var(--forge-bg-void); border: 1px solid var(--forge-accent-primary); border-radius: var(--forge-radius-md);
          padding: 10px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          font-family: var(--forge-font-tech); letter-spacing: 0.02em;
        }
        .btn-primary:hover { background: var(--forge-accent-primary-h); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          background: var(--forge-bg-elevated); color: var(--forge-text-primary); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md);
          padding: 10px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .btn-secondary:hover { background: var(--forge-bg-overlay); border-color: var(--forge-border-active); }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

        .banner {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: var(--forge-radius-md); margin: 10px 0 16px 0; font-size: 14px;
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); color: var(--forge-text-secondary);
        }
        .banner.success { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .banner.error { border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.08); color: var(--forge-error); }

        /* Tabs */
        .tab-bar {
          display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 2px solid var(--forge-border-default); padding-bottom: 0;
        }
        .tab-btn {
          display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px;
          border: none; background: none; font-size: 14px; font-weight: 600;
          color: var(--forge-text-muted); cursor: pointer; border-bottom: 2px solid transparent;
          margin-bottom: -2px; transition: color 0.15s, border-color 0.15s;
          font-family: var(--forge-font-tech); letter-spacing: 0.04em;
        }
        .tab-btn:hover { color: var(--forge-text-primary); }
        .tab-btn.active { color: var(--forge-accent-primary); border-bottom-color: var(--forge-accent-primary); }

        .tab-content { }

        .admin-card { background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-xl); overflow: hidden; }

        .card-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          padding: 14px; border-bottom: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated);
        }
        .card-header h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--forge-text-primary); font-family: var(--forge-font-heading); }
        .card-description { margin: 4px 0 0 0; font-size: 13px; color: var(--forge-text-muted); max-width: 760px; }
        .card-body { padding: 14px; }

        .empty-state { padding: 18px; text-align: center; color: var(--forge-text-muted); }
        .empty-state h3 { margin: 10px 0 4px 0; color: var(--forge-text-primary); font-size: 16px; }
        .empty-state p { margin: 0; font-size: 13px; }

        .muted { color: var(--forge-text-muted); font-size: 12px; }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }

        .field label {
          display: block; font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-secondary); margin-bottom: 6px;
          font-family: var(--forge-font-tech);
        }

        .input {
          width: 100%; border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md);
          padding: 10px 12px; font-size: 14px; outline: none; background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
        }
        .input:focus { border-color: var(--forge-accent-primary); }
        .help { font-size: 12px; color: var(--forge-text-muted); margin-top: 6px; }

        .icon-btn {
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); border-radius: var(--forge-radius-md);
          padding: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
          color: var(--forge-text-secondary);
        }
        .icon-btn:hover { background: var(--forge-bg-overlay); color: var(--forge-text-primary); }

        /* Security note */
        .security-note {
          display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px;
          border: 1px solid rgba(255,181,71,0.3); background: rgba(255,181,71,0.08); border-radius: var(--forge-radius-md);
          font-size: 13px; color: var(--forge-warning);
        }

        /* Trigger list */
        .trigger-list { display: grid; gap: 12px; }
        .trigger-row {
          border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-xl); padding: 12px; background: var(--forge-bg-surface);
        }
        .trigger-header {
          display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px;
        }
        .trigger-left { display: flex; flex-direction: column; gap: 4px; }
        .trigger-event-name { font-weight: 700; color: var(--forge-text-primary); }
        .trigger-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .trigger-fields { grid-template-columns: 1fr; } }

        /* Log table */
        .log-table { display: grid; gap: 0; overflow-x: auto; }
        .log-header {
          display: grid; grid-template-columns: 170px 180px 1fr 90px 130px; gap: 8px;
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-muted); padding: 8px 12px;
          background: var(--forge-bg-elevated); border-bottom: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md) var(--forge-radius-md) 0 0;
          font-family: var(--forge-font-tech);
        }
        .log-row {
          display: grid; grid-template-columns: 170px 180px 1fr 90px 130px; gap: 8px;
          font-size: 13px; color: var(--forge-text-secondary); padding: 8px 12px;
          border-bottom: 1px solid var(--forge-border-default); align-items: center;
        }
        .log-row:last-child { border-bottom: none; }
        .log-date { font-size: 12px; color: var(--forge-text-muted); font-family: var(--forge-font-mono); }
        .log-recipient { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--forge-text-primary); }
        .log-subject { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .log-status { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; }
        .log-status.sent { color: var(--forge-success); }
        .log-status.failed { color: var(--forge-error); }
        .log-trigger { font-size: 12px; color: var(--forge-text-muted); font-family: var(--forge-font-mono); }
        @media (max-width: 900px) {
          .log-header, .log-row { grid-template-columns: 1fr 1fr; }
          .log-header span:nth-child(n+3), .log-row span:nth-child(n+3) { display: none; }
        }

        /* ================================================================
           TEMPLATE EDITOR STYLES
           ================================================================ */

        /* Template type selector */
        .tpl-selector {
          display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .tpl-selector-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: var(--forge-radius-md);
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-surface); color: var(--forge-text-secondary);
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.15s;
          font-family: var(--forge-font-tech);
        }
        .tpl-selector-btn:hover {
          background: var(--forge-bg-elevated); color: var(--forge-text-primary);
          border-color: var(--forge-border-active);
        }
        .tpl-selector-btn.active {
          background: rgba(0,212,170,0.1); color: var(--forge-accent-primary);
          border-color: var(--forge-accent-primary);
        }

        /* Editor layout */
        .tpl-editor-layout {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        @media (max-width: 1100px) {
          .tpl-editor-layout { grid-template-columns: 1fr; }
        }
        .tpl-editor-panel { min-width: 0; }
        .tpl-preview-panel { min-width: 0; }

        /* Variable chips */
        .var-chips {
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .var-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: 999px;
          border: 1px solid rgba(0,212,170,0.3);
          background: rgba(0,212,170,0.1);
          color: var(--forge-accent-primary);
          font-size: 12px; font-weight: 600; cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          font-family: var(--forge-font-tech);
        }
        .var-chip:hover {
          background: rgba(0,212,170,0.2);
          border-color: var(--forge-accent-primary);
        }
        .var-chip-key { font-family: var(--forge-font-mono, monospace); }

        /* Editor toolbar */
        .editor-toolbar {
          display: flex; gap: 2px; padding: 6px;
          background: var(--forge-bg-elevated);
          border: 1px solid var(--forge-border-default);
          border-bottom: none;
          border-radius: var(--forge-radius-md) var(--forge-radius-md) 0 0;
          flex-wrap: wrap;
        }
        .toolbar-btn {
          border: none; background: none; cursor: pointer;
          padding: 6px 8px; border-radius: 4px;
          color: var(--forge-text-secondary); display: inline-flex; align-items: center;
          transition: background 0.1s, color 0.1s;
        }
        .toolbar-btn:hover {
          background: var(--forge-bg-overlay); color: var(--forge-text-primary);
        }
        .toolbar-sep {
          width: 1px; background: var(--forge-border-default);
          margin: 4px 4px; align-self: stretch;
        }

        /* ContentEditable body */
        .tpl-editor-body {
          border: 1px solid var(--forge-border-default);
          border-top: none;
          border-radius: 0 0 var(--forge-radius-md) var(--forge-radius-md);
          padding: 16px;
          min-height: 280px;
          background: #ffffff;
          color: #1a1a2e;
          font-size: 14px;
          line-height: 1.6;
          outline: none;
          overflow-y: auto;
          max-height: 500px;
        }
        .tpl-editor-body:focus {
          border-color: var(--forge-accent-primary);
        }
        .tpl-editor-body h2 { font-size: 18px; margin-bottom: 8px; color: #1a1a2e; }
        .tpl-editor-body p { margin-bottom: 8px; }
        .tpl-editor-body a { color: #00d4aa; text-decoration: underline; }
        .tpl-editor-body ul { margin: 0 0 8px 20px; }
        .tpl-editor-body li { margin-bottom: 4px; }
      `}</style>
      <ConfirmDialog />
    </div>
  );
}
