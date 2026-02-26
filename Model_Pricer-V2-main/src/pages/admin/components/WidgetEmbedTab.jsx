import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

/**
 * WidgetEmbedTab -- Tab 2: Embed code display + copy.
 *
 * Two embed modes:
 *   1. Script tag (recommended) -- widget.js auto-loader with resize, events, Shopify
 *   2. Iframe (direct) -- manual iframe with inline resize script
 *
 * Props:
 *   widget - the selected widget object (from widgets list, NOT editor)
 */

/**
 * Sanitize widget name for safe use in HTML comments.
 * Strips sequences that could break out of an HTML comment (-- and >).
 */
function sanitizeForComment(str) {
  return String(str || '').replace(/-{2,}/g, '-').replace(/>/g, '');
}

function buildScriptEmbedCode(widget) {
  if (!widget) return '';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
  const publicId = widget.publicId || 'WIDGET_ID';
  const name = sanitizeForComment(widget.name || publicId);

  return (
    `<!-- ModelPricer Widget: ${name} -->\n` +
    `<div data-modelpricer-widget="${publicId}"></div>\n` +
    `<script src="${origin}/widget.js" async></script>`
  );
}

function buildIframeEmbedCode(widget) {
  if (!widget) return '';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
  const publicId = widget.publicId || 'WIDGET_ID';
  const name = sanitizeForComment(widget.name || publicId);

  return (
    `<!-- ModelPricer Widget: ${name} -->\n` +
    `<iframe\n` +
    `  src="${origin}/w/${publicId}"\n` +
    `  style="width: 100%; border: none; min-height: 600px;"\n` +
    `  title="3D Print Calculator"\n` +
    `  allow="clipboard-write"\n` +
    `  sandbox="allow-scripts allow-same-origin allow-forms"\n` +
    `></iframe>\n` +
    `<script>\n` +
    `  window.addEventListener('message', function(e) {\n` +
    `    if (e.origin !== '${origin}') return;\n` +
    `    if (e.data?.type === 'MODELPRICER_RESIZE' || e.data?.type === 'MODELPRICER_WIDGET_HEIGHT') {\n` +
    `      var iframe = document.querySelector('iframe[src*="${publicId}"]');\n` +
    `      if (iframe && e.data.height) {\n` +
    `        iframe.style.height = e.data.height + 'px';\n` +
    `      }\n` +
    `    }\n` +
    `  });\n` +
    `</script>`
  );
}

const MODE_LABELS = {
  script: 'Script tag (doporuceno)',
  iframe: 'Primy iframe',
};

const MODE_DESCRIPTIONS = {
  script: 'Automaticka inicializace, auto-resize, podpora Shopify a event callbacku.',
  iframe: 'Primy iframe s rucnim resize skriptem. Pouzijte pokud nemate pristup ke skriptum na webu.',
};

const WidgetEmbedTab = ({ widget }) => {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState('script');

  const embedCode = useMemo(
    () => mode === 'script' ? buildScriptEmbedCode(widget) : buildIframeEmbedCode(widget),
    [widget, mode]
  );

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = embedCode;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // silent fail
      }
    }
  };

  if (!widget) return null;

  return (
    <div className="aw-embed-tab">
      {/* Mode switcher */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        background: 'var(--forge-bg-tertiary, #1A1D23)',
        borderRadius: '8px',
        padding: '4px',
      }}>
        {['script', 'iframe'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setCopied(false); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'var(--forge-font-body)',
              fontWeight: mode === m ? 600 : 400,
              background: mode === m ? 'var(--forge-accent-primary, #00D4AA)' : 'transparent',
              color: mode === m ? '#000' : 'var(--forge-text-secondary, #94A3B8)',
              transition: 'all 150ms ease',
            }}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="aw-embed-header">
        <div>
          <div className="aw-embed-title">
            Embed kod ({mode === 'script' ? 'script tag' : 'iframe'})
          </div>
          <div className="aw-muted">{MODE_DESCRIPTIONS[mode]}</div>
        </div>
        <button
          className={`aw-btn ${copied ? 'aw-btn-success' : 'aw-btn-secondary'}`}
          onClick={onCopy}
        >
          <Icon name={copied ? 'Check' : 'Copy'} size={16} />
          {copied ? 'Zkopirovano!' : 'Kopirovat'}
        </button>
      </div>

      <textarea
        className="aw-code-area"
        readOnly
        value={embedCode}
        rows={mode === 'script' ? 5 : 16}
        onClick={(e) => e.target.select()}
      />

      <div className="aw-embed-instructions">
        <Icon name="Info" size={16} style={{ color: 'var(--forge-accent-primary)', flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--forge-text-primary)' }}>Jak pouzit:</strong>{' '}
          {mode === 'script'
            ? 'Zkopirujte kod vyse a vlozte ho na svuj web. Widget.js se postara o vytvoreni iframe, automaticky resize a komunikaci s vasim webem.'
            : 'Zkopirujte kod vyse a vlozte ho na svuj web (do HTML stranky nebo pres CMS jako vlastni HTML blok). Widget se automaticky prizpusobi sirce kontejneru a vysku obsahu.'
          }
        </div>
      </div>
    </div>
  );
};

export default WidgetEmbedTab;
