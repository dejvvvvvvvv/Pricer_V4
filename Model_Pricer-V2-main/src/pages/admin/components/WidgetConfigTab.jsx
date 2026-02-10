import React from 'react';

/**
 * WidgetConfigTab -- Tab 1: Widget configuration form.
 *
 * Props:
 *   editor        - current editor state object
 *   errors        - validation errors object { name?, primaryColorOverride?, widthPx? }
 *   onEditorChange - (patch) => void -- merges patch into editor
 */
const WidgetConfigTab = ({ editor, errors, onEditorChange }) => {
  if (!editor) return null;

  const update = (field, value) => {
    onEditorChange({ [field]: value });
  };

  return (
    <div className="aw-config-tab">
      {/* Widget name */}
      <div className="aw-form-row">
        <label className="aw-label">Nazev widgetu</label>
        <input
          className={`aw-input ${errors.name ? 'aw-input-error' : ''}`}
          value={editor.name || ''}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Napr. Homepage"
        />
        {errors.name ? <div className="aw-error-text">{errors.name}</div> : null}
      </div>

      {/* Widget type */}
      <div className="aw-form-row">
        <label className="aw-label">Typ widgetu</label>
        <select
          className="aw-input"
          value={editor.type}
          onChange={(e) => update('type', e.target.value)}
        >
          <option value="full_calculator">Full Calculator</option>
          <option value="price_only">Price Only</option>
        </select>
      </div>

      {/* Theme mode */}
      <div className="aw-form-row">
        <label className="aw-label">Theme</label>
        <select
          className="aw-input"
          value={editor.themeMode}
          onChange={(e) => update('themeMode', e.target.value)}
        >
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {/* Primary color override */}
      <div className="aw-form-row">
        <label className="aw-label">Primary color (override)</label>
        <div className="aw-color-row">
          <input
            type="color"
            className="aw-color-picker"
            value={editor.primaryColorOverride || '#00D4AA'}
            onChange={(e) => update('primaryColorOverride', e.target.value)}
          />
          <input
            className={`aw-input ${errors.primaryColorOverride ? 'aw-input-error' : ''}`}
            value={editor.primaryColorOverride || ''}
            onChange={(e) => update('primaryColorOverride', e.target.value)}
            placeholder="#00D4AA (prazdne = z Brandingu)"
          />
        </div>
        {errors.primaryColorOverride ? (
          <div className="aw-error-text">{errors.primaryColorOverride}</div>
        ) : null}
      </div>

      {/* Width mode */}
      <div className="aw-form-row">
        <label className="aw-label">Sirka</label>
        <div className="aw-inline-row">
          <select
            className="aw-input"
            value={editor.widthMode}
            onChange={(e) => update('widthMode', e.target.value)}
          >
            <option value="auto">Auto (100%)</option>
            <option value="fixed">Fixni (px)</option>
          </select>
          <input
            className={`aw-input ${errors.widthPx ? 'aw-input-error' : ''}`}
            style={{ width: 120 }}
            type="number"
            min={0}
            value={editor.widthMode === 'fixed' ? (editor.widthPx ?? '') : ''}
            onChange={(e) => update('widthPx', e.target.value)}
            placeholder="px"
            disabled={editor.widthMode !== 'fixed'}
          />
        </div>
        {errors.widthPx ? <div className="aw-error-text">{errors.widthPx}</div> : null}
      </div>

      {/* Locale */}
      <div className="aw-form-row">
        <label className="aw-label">Jazyk</label>
        <select
          className="aw-input"
          value={editor.localeDefault || 'cs'}
          onChange={(e) => update('localeDefault', e.target.value)}
        >
          <option value="cs">Cestina (cs)</option>
          <option value="en">Anglictina (en)</option>
        </select>
      </div>
    </div>
  );
};

export default WidgetConfigTab;
