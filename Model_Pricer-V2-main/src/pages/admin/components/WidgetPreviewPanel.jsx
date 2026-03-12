import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

/**
 * WidgetPreviewPanel -- Live preview of widget with responsive toggle.
 *
 * Props:
 *   editor - current editor state (with live changes)
 */
const WidgetPreviewPanel = ({ editor }) => {
  const [previewDevice, setPreviewDevice] = useState('desktop');

  const previewWidth = previewDevice === 'mobile' ? 375 : '100%';

  const previewStyle = useMemo(() => {
    if (!editor) return {};
    const borderRadius = `${editor.borderRadius ?? 8}px`;
    const primaryColor = editor.primaryColorOverride || '#00D4AA';
    const themeMode = editor.themeMode || 'auto';
    const isDark = themeMode === 'dark' || themeMode === 'auto';

    return {
      borderRadius,
      '--preview-primary': primaryColor,
      '--preview-bg': isDark ? '#13161C' : '#ffffff',
      '--preview-surface': isDark ? '#1A1D23' : '#f8f9fa',
      '--preview-text': isDark ? '#E2E8F0' : '#1a202c',
      '--preview-text-muted': isDark ? '#7A8291' : '#718096',
      '--preview-border': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    };
  }, [editor]);

  if (!editor) return null;

  const sections = editor.showSections || { upload: true, materials: true, pricingBreakdown: true };

  return (
    <div className="aw-preview-panel">
      <div className="aw-preview-header">
        <div className="aw-preview-title">
          <Icon name="Eye" size={16} />
          Nahled
        </div>
        <div className="aw-preview-devices">
          <button
            type="button"
            className={`aw-device-btn ${previewDevice === 'desktop' ? 'aw-device-btn-active' : ''}`}
            onClick={() => setPreviewDevice('desktop')}
            title="Desktop"
          >
            <Icon name="Monitor" size={16} />
          </button>
          <button
            type="button"
            className={`aw-device-btn ${previewDevice === 'mobile' ? 'aw-device-btn-active' : ''}`}
            onClick={() => setPreviewDevice('mobile')}
            title="Mobil"
          >
            <Icon name="Smartphone" size={16} />
          </button>
        </div>
      </div>

      <div className="aw-preview-viewport">
        <div
          className="aw-preview-frame"
          style={{
            width: previewWidth,
            maxWidth: '100%',
            margin: previewDevice === 'mobile' ? '0 auto' : undefined,
            transition: 'width 0.3s ease',
          }}
        >
          {/* Simulated widget preview */}
          <div
            className="aw-preview-widget"
            style={{
              borderRadius: previewStyle.borderRadius,
              backgroundColor: previewStyle['--preview-bg'],
              border: `1px solid ${previewStyle['--preview-border']}`,
            }}
          >
            {/* Header bar */}
            <div
              className="aw-preview-widget-header"
              style={{
                backgroundColor: previewStyle['--preview-surface'],
                borderBottom: `1px solid ${previewStyle['--preview-border']}`,
                borderRadius: `${previewStyle.borderRadius} ${previewStyle.borderRadius} 0 0`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: previewStyle['--preview-primary'],
                  boxShadow: `0 0 6px ${previewStyle['--preview-primary']}40`,
                }}
              />
              <span style={{ color: previewStyle['--preview-text'], fontSize: 13, fontWeight: 700 }}>
                3D Print Kalkulacka
              </span>
            </div>

            {/* Upload section */}
            {sections.upload !== false ? (
              <div className="aw-preview-section" style={{ borderColor: previewStyle['--preview-border'] }}>
                <div
                  className="aw-preview-upload"
                  style={{
                    borderColor: previewStyle['--preview-primary'],
                    backgroundColor: `${previewStyle['--preview-primary']}08`,
                  }}
                >
                  <Icon name="Upload" size={20} style={{ color: previewStyle['--preview-primary'] }} />
                  <span style={{ color: previewStyle['--preview-text-muted'], fontSize: 12 }}>
                    Nahrajte STL / OBJ / 3MF
                  </span>
                </div>
              </div>
            ) : null}

            {/* Materials section */}
            {sections.materials !== false ? (
              <div className="aw-preview-section" style={{ borderColor: previewStyle['--preview-border'] }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: previewStyle['--preview-text-muted'], marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Material
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['PLA', 'PETG', 'ASA'].map((m, i) => (
                    <div
                      key={m}
                      style={{
                        padding: '5px 10px',
                        borderRadius: (editor.borderRadius ?? 8) / 2,
                        fontSize: 12,
                        fontWeight: 600,
                        border: `1px solid ${i === 0 ? previewStyle['--preview-primary'] : previewStyle['--preview-border']}`,
                        backgroundColor: i === 0 ? `${previewStyle['--preview-primary']}15` : 'transparent',
                        color: i === 0 ? previewStyle['--preview-primary'] : previewStyle['--preview-text-muted'],
                      }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Pricing breakdown section */}
            {sections.pricingBreakdown !== false ? (
              <div className="aw-preview-section" style={{ borderColor: previewStyle['--preview-border'] }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: previewStyle['--preview-text-muted'], marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Cena
                </div>
                {[
                  { label: 'Material', value: '45 Kc' },
                  { label: 'Tisk', value: '120 Kc' },
                  { label: 'Poplatky', value: '15 Kc' },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: previewStyle['--preview-text-muted'] }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: previewStyle['--preview-text'], fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
                <div
                  style={{
                    marginTop: 6,
                    paddingTop: 6,
                    borderTop: `1px solid ${previewStyle['--preview-border']}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: previewStyle['--preview-text'] }}>Celkem</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: previewStyle['--preview-primary'] }}>180 Kc</span>
                </div>
              </div>
            ) : null}

            {/* CTA button */}
            <div className="aw-preview-section" style={{ borderColor: 'transparent', paddingBottom: 12 }}>
              <div
                style={{
                  padding: '10px 16px',
                  borderRadius: (editor.borderRadius ?? 8) / 2,
                  backgroundColor: previewStyle['--preview-primary'],
                  color: '#0a0f1a',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Objednat
              </div>
            </div>
          </div>

          {/* Device label */}
          <div className="aw-preview-device-label">
            {previewDevice === 'mobile' ? '375px (mobil)' : 'Desktop (100%)'}
            {editor.themeMode ? ` / ${editor.themeMode === 'auto' ? 'auto' : editor.themeMode === 'light' ? 'light' : 'dark'}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetPreviewPanel;
