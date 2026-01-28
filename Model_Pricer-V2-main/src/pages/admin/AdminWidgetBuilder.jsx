import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import ColorPicker from '../../components/ui/ColorPicker';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { getTenantId } from '../../utils/adminTenantStorage';
import {
  getWidgets,
  updateWidgetTheme,
  getDefaultWidgetTheme,
} from '../../utils/adminBrandingWidgetStorage';
import {
  THEME_PROPERTIES,
  FONT_OPTIONS,
  themeToCssVars,
} from '../../utils/widgetThemeStorage';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Admin Widget Builder - Visual theme editor for widget instances.
 * Route: /admin/widget/builder/:id
 *
 * Features:
 * - Live preview of widget with theme changes
 * - Color pickers for all themeable elements
 * - Font family and corner radius controls
 * - Embed code generator
 * - Save/reset functionality
 */
const AdminWidgetBuilder = () => {
  const { id: widgetId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tenantId = getTenantId();
  const iframeRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [widget, setWidget] = useState(null);
  const [theme, setTheme] = useState(getDefaultWidgetTheme());
  const [originalTheme, setOriginalTheme] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [toast, setToast] = useState(null);
  const [embedCopied, setEmbedCopied] = useState(false);

  const toastTimer = useRef(null);

  const showToast = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // Load widget
  useEffect(() => {
    if (!widgetId || !tenantId) {
      setLoading(false);
      return;
    }

    const widgets = getWidgets(tenantId);
    const found = widgets.find((w) => w.id === widgetId);

    if (!found) {
      showToast('Widget nenalezen', 'err');
      setLoading(false);
      return;
    }

    const widgetTheme = {
      ...getDefaultWidgetTheme(),
      ...(found.themeConfig || {}),
    };

    setWidget(found);
    setTheme(widgetTheme);
    setOriginalTheme(JSON.parse(JSON.stringify(widgetTheme)));
    setLoading(false);
  }, [widgetId, tenantId, showToast]);

  // Check if theme has unsaved changes
  const isDirty = useMemo(() => {
    if (!originalTheme) return false;
    return JSON.stringify(theme) !== JSON.stringify(originalTheme);
  }, [theme, originalTheme]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Update theme property
  const updateTheme = useCallback((key, value) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Reset to original
  const handleReset = useCallback(() => {
    if (!originalTheme) return;
    const ok = window.confirm('Opravdu chces vratit zmeny do puvodniho stavu?');
    if (!ok) return;
    setTheme(JSON.parse(JSON.stringify(originalTheme)));
    showToast('Zmeny vraceny');
  }, [originalTheme, showToast]);

  // Reset to defaults
  const handleResetDefaults = useCallback(() => {
    const ok = window.confirm('Opravdu chces vratit theme na vychozi hodnoty?');
    if (!ok) return;
    setTheme(getDefaultWidgetTheme());
    showToast('Theme vracen na vychozi');
  }, [showToast]);

  // Save theme
  const handleSave = useCallback(async () => {
    if (!widget || !tenantId) return;

    setSaving(true);
    try {
      updateWidgetTheme(tenantId, widget.id, theme);
      setOriginalTheme(JSON.parse(JSON.stringify(theme)));
      showToast('Theme ulozen');
    } catch (e) {
      console.error('[AdminWidgetBuilder] Save failed:', e);
      showToast('Ulozeni selhalo', 'err');
    } finally {
      setSaving(false);
    }
  }, [widget, tenantId, theme, showToast]);

  // Generate embed code
  const embedCode = useMemo(() => {
    if (!widget) return '';

    const baseUrl = window.location.origin;
    const widgetUrl = `${baseUrl}/w/${widget.publicId}`;

    return `<!-- ModelPricer Widget: ${widget.name} -->
<iframe
  src="${widgetUrl}"
  style="width: 100%; border: none; min-height: 600px;"
  title="3D Print Calculator"
  allow="clipboard-write"
></iframe>
<script>
  // Auto-resize iframe
  window.addEventListener('message', function(e) {
    if (e.data?.type === 'MODELPRICER_RESIZE') {
      var iframe = document.querySelector('iframe[src*="${widget.publicId}"]');
      if (iframe && e.data.height) {
        iframe.style.height = e.data.height + 'px';
      }
    }
  });
</script>`;
  }, [widget]);

  // Copy embed code
  const handleCopyEmbed = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
      showToast('Kod zkopirovan');
    } catch (e) {
      console.error('[AdminWidgetBuilder] Copy failed:', e);
      showToast('Kopirovani selhalo', 'err');
    }
  }, [embedCode, showToast]);

  // Group theme properties by category
  const groupedProperties = useMemo(() => {
    const groups = {};
    THEME_PROPERTIES.forEach((prop) => {
      const cat = prop.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(prop);
    });
    return groups;
  }, []);

  const categoryLabels = {
    background: 'Pozadi',
    text: 'Text',
    button: 'Tlacitka',
    input: 'Inputy',
    border: 'Ramecky',
    typography: 'Typografie',
    dimensions: 'Rozmery',
    other: 'Ostatni',
  };

  // CSS for live preview
  const previewCssVars = useMemo(() => themeToCssVars(theme), [theme]);
  const previewStyle = useMemo(() => {
    return Object.entries(previewCssVars)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
  }, [previewCssVars]);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader" size={32} className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="admin-page">
        <div className="text-center py-20">
          <Icon name="AlertTriangle" size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Widget nenalezen</h2>
          <p className="text-muted-foreground mb-4">Widget s ID "{widgetId}" neexistuje.</p>
          <button className="btn-primary" onClick={() => navigate('/admin/widget')}>
            Zpet na seznam widgetu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            onClick={() => navigate('/admin/widget')}
            title="Zpet"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Widget Builder</h1>
            <p className="text-sm text-muted-foreground">
              {widget.name} ({widget.publicId})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <Icon name="AlertTriangle" size={14} />
              Neulozene zmeny
            </span>
          )}
          <button
            className="btn-secondary"
            onClick={handleReset}
            disabled={!isDirty}
          >
            <Icon name="RotateCcw" size={16} />
            Vratit zmeny
          </button>
          <button
            className="btn-secondary"
            onClick={handleResetDefaults}
          >
            <Icon name="RefreshCw" size={16} />
            Vychozi
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            <Icon name="Save" size={16} />
            {saving ? 'Ukladam...' : 'Ulozit'}
          </button>
        </div>
      </div>

      {/* Main content - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left: Theme editor */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Icon name="Palette" size={18} />
              Theme Editor
            </h2>

            {Object.entries(groupedProperties).map(([category, props]) => (
              <details key={category} className="mb-4" open={category === 'background' || category === 'button'}>
                <summary className="cursor-pointer text-sm font-medium text-foreground mb-3 select-none">
                  {categoryLabels[category] || category}
                </summary>
                <div className="space-y-3 pl-2">
                  {props.map((prop) => {
                    if (prop.type === 'color') {
                      return (
                        <ColorPicker
                          key={prop.key}
                          label={prop.label}
                          value={theme[prop.key] || ''}
                          onChange={(val) => updateTheme(prop.key, val)}
                          showSwatches={true}
                        />
                      );
                    }

                    if (prop.type === 'font') {
                      return (
                        <div key={prop.key}>
                          <label className="block text-sm font-medium mb-1.5">{prop.label}</label>
                          <Select
                            options={FONT_OPTIONS}
                            value={theme[prop.key] || FONT_OPTIONS[0].value}
                            onChange={(val) => updateTheme(prop.key, val)}
                          />
                        </div>
                      );
                    }

                    if (prop.type === 'number') {
                      return (
                        <div key={prop.key}>
                          <label className="block text-sm font-medium mb-1.5">
                            {prop.label}: {theme[prop.key]}{prop.unit || ''}
                          </label>
                          <input
                            type="range"
                            min={prop.min || 0}
                            max={prop.max || 100}
                            value={theme[prop.key] || 0}
                            onChange={(e) => updateTheme(prop.key, parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </details>
            ))}
          </div>

          {/* Embed code */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Icon name="Code" size={18} />
                Embed kod
              </h2>
              <button
                className="btn-secondary text-sm"
                onClick={handleCopyEmbed}
              >
                <Icon name={embedCopied ? 'Check' : 'Copy'} size={14} />
                {embedCopied ? 'Zkopirovano!' : 'Kopirovat'}
              </button>
            </div>
            <textarea
              className="w-full h-48 p-3 rounded-lg border border-border bg-muted/30 font-mono text-xs"
              value={embedCode}
              readOnly
            />
            <p className="text-xs text-muted-foreground mt-2">
              Vloz tento kod na svuj web pro zobrazeni kalkulacky.
            </p>
          </div>
        </div>

        {/* Right: Live preview */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-sm font-medium">Nahled</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
          <div
            className="p-4 min-h-[600px] overflow-auto"
            style={{
              backgroundColor: theme.backgroundColor || '#FFFFFF',
              ...previewCssVars,
            }}
          >
            {/* Preview box showing theme colors */}
            <div
              className="p-4 rounded-xl border mb-4"
              style={{
                backgroundColor: theme.cardColor,
                borderColor: theme.borderColor,
                borderRadius: `${theme.cornerRadius}px`,
                fontFamily: theme.fontFamily,
              }}
            >
              <h3 style={{ color: theme.headerColor, fontWeight: 600, marginBottom: '8px' }}>
                Nahled kalkulacky
              </h3>
              <p style={{ color: theme.mutedColor, fontSize: '14px', marginBottom: '16px' }}>
                Toto je nahled jak bude widget vypadat.
              </p>

              {/* Sample input */}
              <div className="mb-4">
                <label style={{ color: theme.textColor, fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                  Pocet kusu
                </label>
                <input
                  type="number"
                  defaultValue={1}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: `${theme.cornerRadius}px`,
                    border: `1px solid ${theme.inputBorderColor}`,
                    backgroundColor: theme.inputBgColor,
                    color: theme.textColor,
                  }}
                />
              </div>

              {/* Sample button */}
              <button
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: `${theme.cornerRadius}px`,
                  backgroundColor: theme.buttonPrimaryColor,
                  color: theme.buttonTextColor,
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Spocitat cenu
              </button>
            </div>

            {/* Summary preview */}
            <div
              className="p-4 rounded-xl"
              style={{
                backgroundColor: theme.summaryBgColor,
                borderRadius: `${theme.cornerRadius}px`,
                border: `1px solid ${theme.borderColor}`,
              }}
            >
              <div style={{ color: theme.mutedColor, fontSize: '12px' }}>Celkem</div>
              <div style={{ color: theme.headerColor, fontSize: '24px', fontWeight: 700 }}>
                1 250 Kc
              </div>
              <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${theme.borderColor}` }}>
                <div className="flex justify-between" style={{ fontSize: '14px' }}>
                  <span style={{ color: theme.mutedColor }}>Material</span>
                  <span style={{ color: theme.textColor }}>850 Kc</span>
                </div>
                <div className="flex justify-between mt-1" style={{ fontSize: '14px' }}>
                  <span style={{ color: theme.mutedColor }}>Cas tisku</span>
                  <span style={{ color: theme.textColor }}>400 Kc</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 ${
            toast.kind === 'err' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'
          }`}
        >
          <Icon name={toast.kind === 'err' ? 'XCircle' : 'CheckCircle'} size={18} />
          <span className="font-medium">{toast.msg}</span>
        </div>
      )}

      <style>{`
        .admin-page { padding: 20px; }

        .admin-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .btn-primary, .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          border: 1px solid transparent;
          font-size: 14px;
          transition: all 0.15s;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          color: #111827;
          border-color: #e5e7eb;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default AdminWidgetBuilder;
