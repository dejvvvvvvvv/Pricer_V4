import React, { useState, useMemo, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import { CopyButton } from '../../../components/ui/forge/CopyButton';

/**
 * WidgetEmbedTab -- Enhanced embed code generator with:
 *   - Platform-specific snippets (HTML, WordPress, Shopify Liquid, React)
 *   - Configuration options (width, height, theme, language) that affect generated code
 *   - Live code preview
 *   - Copy with feedback (via CopyButton)
 *   - "Test embed" button to open widget in new tab
 *
 * Props:
 *   widget - the selected widget object (from widgets list, NOT editor)
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function sanitizeForComment(str) {
  return String(str || '').replace(/-{2,}/g, '-').replace(/>/g, '');
}

/* ------------------------------------------------------------------ */
/*  Platform definitions                                               */
/* ------------------------------------------------------------------ */

const PLATFORMS = [
  { id: 'html',      label: 'HTML',       icon: 'Code' },
  { id: 'wordpress', label: 'WordPress',  icon: 'Globe' },
  { id: 'shopify',   label: 'Shopify',    icon: 'ShoppingBag' },
  { id: 'react',     label: 'React',      icon: 'Boxes' },
];

const THEME_OPTIONS = [
  { value: 'auto', label: 'Auto (system)' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

const LANG_OPTIONS = [
  { value: 'cs', label: 'Cestina' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
];

/* ------------------------------------------------------------------ */
/*  Snippet generators                                                 */
/* ------------------------------------------------------------------ */

function buildDataAttrs(config) {
  const attrs = [];
  if (config.theme && config.theme !== 'auto') {
    attrs.push(`data-theme="${config.theme}"`);
  }
  if (config.lang && config.lang !== 'cs') {
    attrs.push(`data-lang="${config.lang}"`);
  }
  return attrs;
}

function buildStyleString(config) {
  const parts = ['border: none'];
  if (config.widthMode === 'fixed' && config.widthPx > 0) {
    parts.push(`width: ${config.widthPx}px`);
  } else {
    parts.push('width: 100%');
  }
  if (config.heightMode === 'fixed' && config.heightPx > 0) {
    parts.push(`height: ${config.heightPx}px`);
  } else {
    parts.push(`min-height: ${config.minHeight || 600}px`);
  }
  return parts.join('; ');
}

function buildContainerStyle(config) {
  const parts = [];
  if (config.widthMode === 'fixed' && config.widthPx > 0) {
    parts.push(`max-width: ${config.widthPx}px`);
  } else {
    parts.push('max-width: 100%');
  }
  return parts.join('; ');
}

function getSnippets(widget, config) {
  if (!widget) return {};
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
  const publicId = widget.publicId || 'WIDGET_ID';
  const name = sanitizeForComment(widget.name || publicId);
  const dataAttrs = buildDataAttrs(config);
  const dataAttrsStr = dataAttrs.length > 0 ? '\n     ' + dataAttrs.join('\n     ') : '';

  return {
    html: {
      title: 'HTML — Script tag (doporuceno)',
      description: 'Automaticka inicializace, auto-resize, podpora event callbacku a Shopify integrace.',
      code:
        `<!-- ModelPricer Widget: ${name} -->\n` +
        `<div data-modelpricer-widget="${publicId}"${dataAttrsStr}></div>\n` +
        `<script src="${origin}/widget.js" async></script>`,
    },
    wordpress: {
      title: 'WordPress — Vlastni HTML blok',
      description: 'Pouzijte blok "Vlastni HTML" (Custom HTML) v Gutenberg editoru nebo shortcode v klasickem editoru.',
      code:
        `<!-- ModelPricer Widget pro WordPress -->\n` +
        `<!-- Vlozte jako "Vlastni HTML" blok v Gutenberg editoru -->\n` +
        `<div data-modelpricer-widget="${publicId}"${dataAttrsStr}></div>\n` +
        `<script src="${origin}/widget.js" async></script>\n\n` +
        `<!-- ================================================= -->\n` +
        `<!-- Alternativa: Shortcode (vyzaduje vlastni plugin):  -->\n` +
        `<!-- [modelpricer id="${publicId}"]                      -->\n` +
        `<!-- ================================================= -->\n\n` +
        `<!-- Alternativa: Primy iframe (pokud skripty nejsou povoleny) -->\n` +
        `<!-- <iframe\n` +
        `  src="${origin}/w/${publicId}"\n` +
        `  style="${buildStyleString(config)}"\n` +
        `  title="3D Print Calculator"\n` +
        `  allow="clipboard-write"\n` +
        `></iframe> -->`,
    },
    shopify: {
      title: 'Shopify — Liquid snippet',
      description: 'Vlozte do Custom Liquid sekce v Theme Editoru, nebo do page template. Pro Shopify cart integraci pridejte data-shopify-domain a data-shopify-token atributy.',
      code:
        `{% comment %}\n` +
        `  ModelPricer Widget: ${name}\n` +
        `  Vlozte jako Custom Liquid sekci v Theme Editoru\n` +
        `{% endcomment %}\n\n` +
        `<div class="modelpricer-container" style="${buildContainerStyle(config)}; margin: 2rem auto;">\n` +
        `  <div data-modelpricer-widget="${publicId}"${dataAttrsStr}\n` +
        `       data-shopify-domain="{{ shop.permanent_domain }}"\n` +
        `       data-shopify-token="{{ settings.modelpricer_token | default: '' }}">\n` +
        `  </div>\n` +
        `  <script src="${origin}/widget.js" async></script>\n` +
        `</div>\n\n` +
        `{% comment %}\n` +
        `  Pro Shopify cart integraci:\n` +
        `  1. Pridejte Storefront API token do theme settings\n` +
        `  2. Widget automaticky prida polozky do kosiku\n` +
        `{% endcomment %}`,
    },
    react: {
      title: 'React / Next.js — Komponenta',
      description: 'Pouzijte tuto komponentu v jakemkoli React/Next.js projektu. Pro Next.js pridejte "use client" na prvni radek.',
      code:
        `import { useEffect, useRef } from 'react';\n\n` +
        `/**\n` +
        ` * ModelPricer 3D Print Calculator Widget\n` +
        ` * Widget ID: ${publicId}\n` +
        ` */\n` +
        `export default function ModelPricerWidget({\n` +
        `  width = ${config.widthMode === 'fixed' && config.widthPx > 0 ? `'${config.widthPx}px'` : "'100%'"},\n` +
        `  height = ${config.heightMode === 'fixed' && config.heightPx > 0 ? `'${config.heightPx}px'` : "'auto'"},\n` +
        `  theme = '${config.theme || 'auto'}',\n` +
        `  lang = '${config.lang || 'cs'}',\n` +
        `}) {\n` +
        `  const containerRef = useRef(null);\n\n` +
        `  useEffect(() => {\n` +
        `    const container = containerRef.current;\n` +
        `    if (!container) return;\n\n` +
        `    // Create widget div\n` +
        `    const div = document.createElement('div');\n` +
        `    div.setAttribute('data-modelpricer-widget', '${publicId}');\n` +
        `    if (theme !== 'auto') div.setAttribute('data-theme', theme);\n` +
        `    if (lang !== 'cs') div.setAttribute('data-lang', lang);\n` +
        `    container.appendChild(div);\n\n` +
        `    // Load widget script (idempotent)\n` +
        `    if (!document.querySelector('script[src*="widget.js"]')) {\n` +
        `      const script = document.createElement('script');\n` +
        `      script.src = '${origin}/widget.js';\n` +
        `      script.async = true;\n` +
        `      document.body.appendChild(script);\n` +
        `    } else if (window.__modelpricer_widget_loader__) {\n` +
        `      window.__modelpricer_widget_loader__.initOne(div);\n` +
        `    }\n\n` +
        `    return () => { container.innerHTML = ''; };\n` +
        `  }, [theme, lang]);\n\n` +
        `  return (\n` +
        `    <div\n` +
        `      ref={containerRef}\n` +
        `      style={{ width, minHeight: height === 'auto' ? '600px' : height }}\n` +
        `    />\n` +
        `  );\n` +
        `}`,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Inline styles (Forge tokens)                                       */
/* ------------------------------------------------------------------ */

const s = {
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--forge-text-primary, #E8EAED)',
    fontFamily: 'var(--forge-font-heading)',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  configGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  configField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  configLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--forge-text-muted, #7A8291)',
    fontFamily: 'var(--forge-font-tech)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  configInput: {
    padding: '7px 10px',
    borderRadius: 'var(--forge-radius-sm, 4px)',
    border: '1px solid var(--forge-border, #2a2d35)',
    background: 'var(--forge-bg-tertiary, #1A1D23)',
    color: 'var(--forge-text-primary, #E8EAED)',
    fontSize: '13px',
    fontFamily: 'var(--forge-font-body)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  configSelect: {
    padding: '7px 10px',
    borderRadius: 'var(--forge-radius-sm, 4px)',
    border: '1px solid var(--forge-border, #2a2d35)',
    background: 'var(--forge-bg-tertiary, #1A1D23)',
    color: 'var(--forge-text-primary, #E8EAED)',
    fontSize: '13px',
    fontFamily: 'var(--forge-font-body)',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  },
  platformTabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '16px',
    background: 'var(--forge-bg-tertiary, #1A1D23)',
    borderRadius: '8px',
    padding: '4px',
    flexWrap: 'wrap',
  },
  platformTab: (active) => ({
    flex: '1 1 auto',
    padding: '8px 14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: active ? 600 : 400,
    background: active ? 'var(--forge-accent-primary, #00D4AA)' : 'transparent',
    color: active ? '#000' : 'var(--forge-text-secondary, #94A3B8)',
    transition: 'all 150ms ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
  }),
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    gap: '12px',
  },
  codeTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--forge-text-primary, #E8EAED)',
    fontFamily: 'var(--forge-font-heading)',
  },
  codeDesc: {
    fontSize: '12px',
    color: 'var(--forge-text-muted, #7A8291)',
    marginTop: '4px',
    lineHeight: 1.4,
  },
  codeArea: {
    width: '100%',
    padding: '14px',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border, #2a2d35)',
    background: 'var(--forge-bg-tertiary, #1A1D23)',
    color: 'var(--forge-text-primary, #E8EAED)',
    fontSize: '12px',
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
    lineHeight: 1.5,
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    tabSize: 2,
  },
  previewBox: {
    padding: '14px',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border, #2a2d35)',
    background: 'var(--forge-bg-primary, #13151a)',
    marginTop: '12px',
    overflow: 'hidden',
  },
  previewLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--forge-text-muted, #7A8291)',
    fontFamily: 'var(--forge-font-tech)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  previewContent: {
    background: '#ffffff',
    borderRadius: '6px',
    overflow: 'hidden',
    position: 'relative',
    border: '1px solid #e5e7eb',
  },
  previewIframe: {
    width: '100%',
    border: 'none',
    minHeight: '120px',
    maxHeight: '300px',
    pointerEvents: 'none',
    display: 'block',
  },
  previewPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '32px 16px',
    color: '#6b7280',
    fontSize: '13px',
    background: '#f9fafb',
  },
  actionBar: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  testBtn: {
    padding: '7px 14px',
    borderRadius: 'var(--forge-radius-sm, 4px)',
    border: '1px solid var(--forge-border, #2a2d35)',
    background: 'var(--forge-bg-elevated, #1e2028)',
    color: 'var(--forge-text-primary, #E8EAED)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'var(--forge-font-body)',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  infoBox: {
    display: 'flex',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: 'var(--forge-radius-sm, 4px)',
    background: 'rgba(0, 212, 170, 0.06)',
    border: '1px solid rgba(0, 212, 170, 0.15)',
    marginTop: '14px',
    fontSize: '12px',
    color: 'var(--forge-text-secondary, #94A3B8)',
    lineHeight: 1.5,
  },
  divider: {
    height: '1px',
    background: 'var(--forge-border, #2a2d35)',
    margin: '20px 0',
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const WidgetEmbedTab = ({ widget }) => {
  const [platform, setPlatform] = useState('html');

  // Embed config state (independent from widget saved config)
  const [embedConfig, setEmbedConfig] = useState({
    widthMode: 'responsive',
    widthPx: 800,
    heightMode: 'auto',
    heightPx: 700,
    minHeight: 600,
    theme: 'auto',
    lang: 'cs',
  });

  const [showPreview, setShowPreview] = useState(false);

  const updateConfig = useCallback((key, value) => {
    setEmbedConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const snippets = useMemo(() => getSnippets(widget, embedConfig), [widget, embedConfig]);
  const current = snippets[platform];

  const testEmbedUrl = useMemo(() => {
    if (!widget) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const publicId = widget.publicId || '';
    const params = new URLSearchParams();
    if (embedConfig.theme && embedConfig.theme !== 'auto') params.set('theme', embedConfig.theme);
    if (embedConfig.lang && embedConfig.lang !== 'cs') params.set('lang', embedConfig.lang);
    const qs = params.toString();
    return `${origin}/w/${publicId}${qs ? '?' + qs : ''}`;
  }, [widget, embedConfig.theme, embedConfig.lang]);

  const handleTestEmbed = useCallback(() => {
    if (testEmbedUrl) {
      window.open(testEmbedUrl, '_blank', 'noopener,noreferrer');
    }
  }, [testEmbedUrl]);

  if (!widget) return null;

  const codeRows = current ? Math.min(current.code.split('\n').length + 1, 24) : 5;

  return (
    <div className="aw-embed-tab">
      {/* ── Section 1: Embed Configuration ── */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <Icon name="Settings" size={15} />
          Nastaveni embed kodu
        </div>

        <div style={s.configGrid}>
          {/* Width */}
          <div style={s.configField}>
            <label style={s.configLabel}>Sirka</label>
            <select
              style={s.configSelect}
              value={embedConfig.widthMode}
              onChange={(e) => updateConfig('widthMode', e.target.value)}
            >
              <option value="responsive">Responzivni (100%)</option>
              <option value="fixed">Pevna sirka (px)</option>
            </select>
          </div>
          {embedConfig.widthMode === 'fixed' && (
            <div style={s.configField}>
              <label style={s.configLabel}>Sirka (px)</label>
              <input
                type="number"
                style={s.configInput}
                value={embedConfig.widthPx}
                min={200}
                max={2000}
                onChange={(e) => updateConfig('widthPx', Number(e.target.value) || 800)}
              />
            </div>
          )}

          {/* Height */}
          <div style={s.configField}>
            <label style={s.configLabel}>Vyska</label>
            <select
              style={s.configSelect}
              value={embedConfig.heightMode}
              onChange={(e) => updateConfig('heightMode', e.target.value)}
            >
              <option value="auto">Auto (min-height)</option>
              <option value="fixed">Pevna vyska (px)</option>
            </select>
          </div>
          {embedConfig.heightMode === 'fixed' ? (
            <div style={s.configField}>
              <label style={s.configLabel}>Vyska (px)</label>
              <input
                type="number"
                style={s.configInput}
                value={embedConfig.heightPx}
                min={200}
                max={3000}
                onChange={(e) => updateConfig('heightPx', Number(e.target.value) || 700)}
              />
            </div>
          ) : (
            <div style={s.configField}>
              <label style={s.configLabel}>Minimalni vyska (px)</label>
              <input
                type="number"
                style={s.configInput}
                value={embedConfig.minHeight}
                min={200}
                max={2000}
                onChange={(e) => updateConfig('minHeight', Number(e.target.value) || 600)}
              />
            </div>
          )}

          {/* Theme */}
          <div style={s.configField}>
            <label style={s.configLabel}>Tema</label>
            <select
              style={s.configSelect}
              value={embedConfig.theme}
              onChange={(e) => updateConfig('theme', e.target.value)}
            >
              {THEME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div style={s.configField}>
            <label style={s.configLabel}>Jazyk</label>
            <select
              style={s.configSelect}
              value={embedConfig.lang}
              onChange={(e) => updateConfig('lang', e.target.value)}
            >
              {LANG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={s.divider} />

      {/* ── Section 2: Platform selector ── */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          <Icon name="Code" size={15} />
          Embed kod pro vasi platformu
        </div>

        <div style={s.platformTabs}>
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              style={s.platformTab(platform === p.id)}
              onClick={() => setPlatform(p.id)}
              aria-pressed={platform === p.id}
            >
              <Icon name={p.icon} size={15} />
              {p.label}
            </button>
          ))}
        </div>

        {/* Code display */}
        {current && (
          <>
            <div style={s.codeHeader}>
              <div style={{ flex: 1 }}>
                <div style={s.codeTitle}>{current.title}</div>
                <div style={s.codeDesc}>{current.description}</div>
              </div>
              <div style={s.actionBar}>
                <CopyButton
                  text={current.code}
                  label="Kopirovat kod"
                  copiedLabel="Zkopirovano!"
                />
                <button
                  type="button"
                  style={s.testBtn}
                  onClick={handleTestEmbed}
                  title="Otevrit widget v novem panelu"
                >
                  <Icon name="ExternalLink" size={14} />
                  Test embed
                </button>
              </div>
            </div>

            <textarea
              style={{ ...s.codeArea }}
              readOnly
              value={current.code}
              rows={codeRows}
              onClick={(e) => e.target.select()}
              aria-label={`Embed kod pro ${current.title}`}
            />
          </>
        )}
      </div>

      {/* ── Section 3: Embed preview ── */}
      <div style={s.section}>
        <button
          type="button"
          style={{
            ...s.testBtn,
            marginBottom: '8px',
            background: showPreview
              ? 'var(--forge-accent-primary, #00D4AA)'
              : 'var(--forge-bg-elevated, #1e2028)',
            color: showPreview ? '#000' : 'var(--forge-text-primary, #E8EAED)',
          }}
          onClick={() => setShowPreview((p) => !p)}
        >
          <Icon name={showPreview ? 'EyeOff' : 'Eye'} size={14} />
          {showPreview ? 'Skryt nahled' : 'Zobrazit nahled'}
        </button>

        {showPreview && (
          <div style={s.previewBox}>
            <div style={s.previewLabel}>Nahled widgetu</div>
            <div style={s.previewContent}>
              {widget.publicId ? (
                <iframe
                  src={testEmbedUrl}
                  style={{
                    ...s.previewIframe,
                    width: embedConfig.widthMode === 'fixed' && embedConfig.widthPx > 0
                      ? `${Math.min(embedConfig.widthPx, 600)}px`
                      : '100%',
                    minHeight: embedConfig.heightMode === 'fixed' && embedConfig.heightPx > 0
                      ? `${Math.min(embedConfig.heightPx, 300)}px`
                      : '200px',
                  }}
                  title="Widget nahled"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  loading="lazy"
                />
              ) : (
                <div style={s.previewPlaceholder}>
                  <Icon name="AlertCircle" size={16} />
                  Widget nema prirazene publicId
                </div>
              )}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--forge-text-muted)',
              marginTop: '8px',
              fontFamily: 'var(--forge-font-tech)',
            }}>
              Nahled je pouze informativni. Pro plnohodnotne testovani pouzijte tlacitko "Test embed".
            </div>
          </div>
        )}
      </div>

      {/* ── Info box ── */}
      <div style={s.infoBox}>
        <Icon name="Info" size={16} style={{ color: 'var(--forge-accent-primary)', flexShrink: 0, marginTop: '1px' }} />
        <div>
          <strong style={{ color: 'var(--forge-text-primary)' }}>Jak pouzit:</strong>{' '}
          Zvolte platformu, upravte nastaveni embed kodu a zkopirujte vysledny kod.
          Widget.js se postara o vytvoreni iframe, automaticky resize a komunikaci s vasim webem.
          Pro Shopify integraci s kosikem pridejte data-shopify-domain a data-shopify-token atributy.
        </div>
      </div>
    </div>
  );
};

export default WidgetEmbedTab;
