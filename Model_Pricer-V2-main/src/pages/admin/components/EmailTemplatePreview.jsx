// EmailTemplatePreview.jsx — Renders email template preview in an iframe
// -----------------------------------------------------------------------
// Scope: AdminEmails template editor only
// Features:
//   - Renders HTML template with sample data in sandboxed iframe
//   - Responsive preview toggle (desktop / mobile)
//   - Subject line preview
//   - Plain text fallback view

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../components/AppIcon';
import { renderTemplatePreview } from '../../../utils/adminEmailStorage';

function stripHtmlToPlainText(html) {
  if (!html) return '';
  let text = html;
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/tr>/gi, '\n');
  text = text.replace(/<\/td>/gi, '\t');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function buildEmailHtml(bodyHtml, subjectRendered) {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px; line-height: 1.6; color: #1a1a2e; background: #f5f5f5;
      padding: 24px 16px;
    }
    .email-wrapper {
      max-width: 600px; margin: 0 auto; background: #ffffff;
      border-radius: 8px; overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .email-header {
      background: #1a1a2e; color: #ffffff; padding: 20px 24px;
      font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase;
    }
    .email-subject {
      padding: 16px 24px; border-bottom: 1px solid #e8e8e8;
      font-size: 18px; font-weight: 600; color: #1a1a2e;
    }
    .email-body { padding: 24px; }
    .email-body h2 { font-size: 20px; margin-bottom: 12px; color: #1a1a2e; }
    .email-body p { margin-bottom: 12px; }
    .email-body a { color: #00d4aa; }
    .email-body strong { font-weight: 600; }
    .email-body table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .email-body td { padding: 8px; border-bottom: 1px solid #e8e8e8; }
    .email-footer {
      padding: 16px 24px; border-top: 1px solid #e8e8e8;
      font-size: 12px; color: #999; text-align: center;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">Email Preview</div>
    <div class="email-subject">${subjectRendered}</div>
    <div class="email-body">${bodyHtml}</div>
    <div class="email-footer">Toto je nahled emailu. Skutecny email se muze lisit.</div>
  </div>
</body>
</html>`;
}

export default function EmailTemplatePreview({ subject, body, cs }) {
  const iframeRef = useRef(null);
  const [viewMode, setViewMode] = useState('desktop'); // desktop | mobile | text
  const rendered = useMemo(() => renderTemplatePreview(body, subject), [body, subject]);
  const fullHtml = useMemo(() => buildEmailHtml(rendered.body, rendered.subject), [rendered]);
  const plainText = useMemo(() => stripHtmlToPlainText(rendered.body), [rendered.body]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || viewMode === 'text') return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(fullHtml);
    doc.close();
  }, [fullHtml, viewMode]);

  const iframeWidth = viewMode === 'mobile' ? 375 : '100%';

  return (
    <div className="etp-root">
      <div className="etp-toolbar">
        <span className="etp-label">{cs ? 'Nahled' : 'Preview'}</span>
        <div className="etp-toggle-group">
          <button
            type="button"
            className={`etp-toggle-btn ${viewMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setViewMode('desktop')}
            title={cs ? 'Desktop' : 'Desktop'}
          >
            <Icon name="Monitor" size={15} />
          </button>
          <button
            type="button"
            className={`etp-toggle-btn ${viewMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setViewMode('mobile')}
            title={cs ? 'Mobil' : 'Mobile'}
          >
            <Icon name="Smartphone" size={15} />
          </button>
          <button
            type="button"
            className={`etp-toggle-btn ${viewMode === 'text' ? 'active' : ''}`}
            onClick={() => setViewMode('text')}
            title={cs ? 'Cisty text' : 'Plain text'}
          >
            <Icon name="FileText" size={15} />
          </button>
        </div>
      </div>

      <div className="etp-preview-container">
        {viewMode === 'text' ? (
          <pre className="etp-plaintext">{`Predmet: ${rendered.subject}\n\n${plainText}`}</pre>
        ) : (
          <div className="etp-iframe-wrap" style={{ maxWidth: iframeWidth === '100%' ? 'none' : iframeWidth, margin: iframeWidth !== '100%' ? '0 auto' : undefined }}>
            <iframe
              ref={iframeRef}
              title="Email preview"
              sandbox="allow-same-origin"
              className="etp-iframe"
              style={{ width: iframeWidth }}
            />
          </div>
        )}
      </div>

      <style>{`
        .etp-root {
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-xl);
          overflow: hidden;
          background: var(--forge-bg-surface);
        }
        .etp-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px;
          background: var(--forge-bg-elevated);
          border-bottom: 1px solid var(--forge-border-default);
        }
        .etp-label {
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-secondary);
          font-family: var(--forge-font-tech);
        }
        .etp-toggle-group {
          display: flex; gap: 2px;
          background: var(--forge-bg-surface);
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          padding: 2px;
        }
        .etp-toggle-btn {
          border: none; background: none; cursor: pointer;
          padding: 5px 8px; border-radius: 4px;
          color: var(--forge-text-muted); display: inline-flex; align-items: center;
          transition: background 0.15s, color 0.15s;
        }
        .etp-toggle-btn:hover { color: var(--forge-text-primary); }
        .etp-toggle-btn.active {
          background: var(--forge-accent-primary);
          color: var(--forge-bg-void);
        }
        .etp-preview-container {
          background: #e8e8ec;
          min-height: 320px;
          padding: 16px;
        }
        .etp-iframe-wrap { transition: max-width 0.2s ease; }
        .etp-iframe {
          border: none; width: 100%; min-height: 400px;
          background: #ffffff; border-radius: 6px;
          display: block;
        }
        .etp-plaintext {
          font-family: var(--forge-font-mono, monospace);
          font-size: 13px; color: #1a1a2e; background: #ffffff;
          padding: 16px; border-radius: 6px;
          white-space: pre-wrap; word-break: break-word;
          min-height: 300px; line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
