import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

/**
 * WidgetEmbedTab -- Tab 2: Embed code display + copy.
 *
 * Embed format: iframe Variant A with auto-resize postMessage script.
 *
 * Props:
 *   widget - the selected widget object (from widgets list, NOT editor)
 */

function buildIframeEmbedCode(widget) {
  if (!widget) return '';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
  const publicId = widget.publicId || 'WIDGET_ID';
  const name = widget.name || publicId;

  return (
    `<!-- ModelPricer Widget: ${name} -->\n` +
    `<iframe\n` +
    `  src="${origin}/w/${publicId}"\n` +
    `  style="width: 100%; border: none; min-height: 600px;"\n` +
    `  title="3D Print Calculator"\n` +
    `  allow="clipboard-write"\n` +
    `></iframe>\n` +
    `<script>\n` +
    `  window.addEventListener('message', function(e) {\n` +
    `    if (e.data?.type === 'MODELPRICER_RESIZE') {\n` +
    `      var iframe = document.querySelector('iframe[src*="${publicId}"]');\n` +
    `      if (iframe && e.data.height) {\n` +
    `        iframe.style.height = e.data.height + 'px';\n` +
    `      }\n` +
    `    }\n` +
    `  });\n` +
    `</script>`
  );
}

const WidgetEmbedTab = ({ widget }) => {
  const [copied, setCopied] = useState(false);

  const embedCode = useMemo(() => buildIframeEmbedCode(widget), [widget]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
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
      <div className="aw-embed-header">
        <div>
          <div className="aw-embed-title">Embed kod (iframe)</div>
          <div className="aw-muted">Vloz tento kod na svuj web pro zobrazeni kalkulacky.</div>
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
        rows={14}
        onClick={(e) => e.target.select()}
      />

      <div className="aw-embed-instructions">
        <Icon name="Info" size={16} style={{ color: 'var(--forge-accent-primary)', flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--forge-text-primary)' }}>Jak pouzit:</strong> Zkopirujte kod vyse a vlozte ho na svuj web (do HTML stranky
          nebo pres CMS jako vlastni HTML blok). Widget se automaticky prizpusobi sirce kontejneru
          a vysku obsahu.
        </div>
      </div>
    </div>
  );
};

export default WidgetEmbedTab;
