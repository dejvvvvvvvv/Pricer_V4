import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import { CopyButton } from '../../../components/ui/forge/CopyButton';

/**
 * WidgetIntegrationTab -- Integration guides for different platforms.
 *
 * Props:
 *   widget - the selected widget object
 */

function sanitizeForComment(str) {
  return String(str || '').replace(/-{2,}/g, '-').replace(/>/g, '');
}

const PLATFORMS = [
  { id: 'html', label: 'HTML', icon: 'Code' },
  { id: 'wordpress', label: 'WordPress', icon: 'Globe' },
  { id: 'shopify', label: 'Shopify', icon: 'ShoppingBag' },
  { id: 'react', label: 'React', icon: 'Boxes' },
];

function getSnippets(widget) {
  if (!widget) return {};
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
  const publicId = widget.publicId || 'WIDGET_ID';
  const name = sanitizeForComment(widget.name || publicId);

  return {
    html: {
      title: 'HTML / Staticka stranka',
      description: 'Vlozte tento kod kamkoli na svou HTML stranku. Widget se automaticky nacte a prizpusobi.',
      code:
        `<!-- ModelPricer Widget: ${name} -->\n` +
        `<div data-modelpricer-widget="${publicId}"></div>\n` +
        `<script src="${origin}/widget.js" async></script>`,
    },
    wordpress: {
      title: 'WordPress',
      description: 'Pouzijte blok "Vlastni HTML" (Custom HTML) v editoru stranek/prispevku a vlozte tento kod.',
      code:
        `<!-- ModelPricer Widget pro WordPress -->\n` +
        `<!-- Vlozte do bloku "Vlastni HTML" v editoru -->\n` +
        `<div data-modelpricer-widget="${publicId}"></div>\n` +
        `<script src="${origin}/widget.js" async></script>\n\n` +
        `<!-- Alternativa: primy iframe -->\n` +
        `<!-- <iframe\n` +
        `  src="${origin}/w/${publicId}"\n` +
        `  style="width: 100%; border: none; min-height: 600px;"\n` +
        `  title="3D Print Calculator"\n` +
        `  allow="clipboard-write"\n` +
        `></iframe> -->`,
    },
    shopify: {
      title: 'Shopify (Liquid)',
      description: 'Pridejte tento kod do Shopify stranky pres Online Store > Pages > Upravit kod (nebo pres sekci "Custom Liquid" v Theme Editor).',
      code:
        `{% comment %}\n` +
        `  ModelPricer Widget: ${name}\n` +
        `  Vlozte do Custom Liquid sekce nebo do page template\n` +
        `{% endcomment %}\n\n` +
        `<div class="modelpricer-container" style="max-width: 100%; margin: 2rem auto;">\n` +
        `  <div data-modelpricer-widget="${publicId}"></div>\n` +
        `  <script src="${origin}/widget.js" async></script>\n` +
        `</div>`,
    },
    react: {
      title: 'React / Next.js',
      description: 'Vytvorte komponentu ktera nacte widget skript. Pro Next.js pouzijte dynamicky import nebo useEffect.',
      code:
        `import { useEffect, useRef } from 'react';\n\n` +
        `function ModelPricerWidget() {\n` +
        `  const containerRef = useRef(null);\n\n` +
        `  useEffect(() => {\n` +
        `    // Vytvorime div s data atributem\n` +
        `    const div = document.createElement('div');\n` +
        `    div.setAttribute('data-modelpricer-widget', '${publicId}');\n` +
        `    containerRef.current?.appendChild(div);\n\n` +
        `    // Nacteme widget skript\n` +
        `    const script = document.createElement('script');\n` +
        `    script.src = '${origin}/widget.js';\n` +
        `    script.async = true;\n` +
        `    document.body.appendChild(script);\n\n` +
        `    return () => {\n` +
        `      script.remove();\n` +
        `      if (containerRef.current) containerRef.current.innerHTML = '';\n` +
        `    };\n` +
        `  }, []);\n\n` +
        `  return <div ref={containerRef} />;\n` +
        `}\n\n` +
        `export default ModelPricerWidget;`,
    },
  };
}

const WidgetIntegrationTab = ({ widget }) => {
  const [activePlatform, setActivePlatform] = useState('html');
  const snippets = useMemo(() => getSnippets(widget), [widget]);
  const current = snippets[activePlatform];

  if (!widget) return null;

  return (
    <div className="aw-integration-tab">
      <div className="aw-muted" style={{ marginBottom: 14 }}>
        Kopirujte kod pro vasi platformu a vlozte ho na svuj web.
      </div>

      {/* Platform tabs */}
      <div className="aw-platform-tabs">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`aw-platform-tab ${activePlatform === p.id ? 'aw-platform-tab-active' : ''}`}
            onClick={() => setActivePlatform(p.id)}
          >
            <Icon name={p.icon} size={15} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Platform content */}
      {current ? (
        <div className="aw-platform-content">
          <div className="aw-platform-header">
            <div>
              <div className="aw-platform-title">{current.title}</div>
              <div className="aw-muted">{current.description}</div>
            </div>
            <CopyButton
              text={current.code}
              label="Kopirovat kod"
              copiedLabel="Zkopirovano!"
            />
          </div>
          <textarea
            className="aw-code-area"
            readOnly
            value={current.code}
            rows={Math.min(current.code.split('\n').length + 1, 20)}
            onClick={(e) => e.target.select()}
          />
        </div>
      ) : null}
    </div>
  );
};

export default WidgetIntegrationTab;
