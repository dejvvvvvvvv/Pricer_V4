import React from 'react';
import ForgeCheckbox from '../../../components/ui/forge/ForgeCheckbox';

/**
 * WidgetConfigTab -- Tab 1: Widget configuration form.
 *
 * Props:
 *   editor        - current editor state object
 *   errors        - validation errors object { name?, primaryColorOverride?, widthPx?, heightPx? }
 *   onEditorChange - (patch) => void -- merges patch into editor
 */
const WidgetConfigTab = ({ editor, errors, onEditorChange }) => {
  if (!editor) return null;

  const update = (field, value) => {
    onEditorChange({ [field]: value });
  };

  const sections = editor.showSections || { upload: true, materials: true, pricingBreakdown: true };
  const updateSection = (key, val) => {
    onEditorChange({ showSections: { ...sections, [key]: val } });
  };

  return (
    <div className="aw-config-tab">
      {/* --- Zakladni nastaveni --- */}
      <div className="aw-config-section">
        <div className="aw-config-section-title">Zakladni nastaveni</div>

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

      {/* --- Vzhled --- */}
      <div className="aw-config-section">
        <div className="aw-config-section-title">Vzhled</div>

        {/* Theme mode */}
        <div className="aw-form-row">
          <label className="aw-label">Theme</label>
          <div className="aw-theme-switcher">
            {[
              { value: 'auto', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`aw-theme-option ${editor.themeMode === opt.value ? 'aw-theme-option-active' : ''}`}
                onClick={() => update('themeMode', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="aw-muted" style={{ marginTop: 4 }}>
            {editor.themeMode === 'auto' ? 'Automaticky podle nastaveni webu zakaznika.' : editor.themeMode === 'light' ? 'Vzdy svetly motiv.' : 'Vzdy tmavy motiv.'}
          </div>
        </div>

        {/* Primary color override */}
        <div className="aw-form-row">
          <label className="aw-label">Primarni barva (override)</label>
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

        {/* Border radius */}
        <div className="aw-form-row">
          <label className="aw-label">Zaobleni rohu (border-radius)</label>
          <div className="aw-inline-row">
            <input
              className="aw-input"
              style={{ width: 100 }}
              type="number"
              min={0}
              max={32}
              value={editor.borderRadius ?? 8}
              onChange={(e) => {
                const clamped = Math.max(0, Math.min(32, Number(e.target.value) || 0));
                update('borderRadius', clamped);
              }}
            />
            <span className="aw-muted">px</span>
          </div>
          <div className="aw-border-radius-preview" style={{ borderRadius: `${editor.borderRadius ?? 8}px` }} />
        </div>
      </div>

      {/* --- Rozmery --- */}
      <div className="aw-config-section">
        <div className="aw-config-section-title">Rozmery</div>

        {/* Width mode */}
        <div className="aw-form-row">
          <label className="aw-label">Sirka</label>
          <div className="aw-inline-row">
            <select
              className="aw-input"
              value={editor.widthMode}
              onChange={(e) => update('widthMode', e.target.value)}
            >
              <option value="auto">Plna sirka (100%)</option>
              <option value="fixed">Fixni sirka (px)</option>
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

        {/* Height mode */}
        <div className="aw-form-row">
          <label className="aw-label">Vyska</label>
          <div className="aw-inline-row">
            <select
              className="aw-input"
              value={editor.heightMode || 'auto'}
              onChange={(e) => update('heightMode', e.target.value)}
            >
              <option value="auto">Automaticka (podle obsahu)</option>
              <option value="fixed">Fixni vyska (px)</option>
            </select>
            <input
              className={`aw-input ${errors.heightPx ? 'aw-input-error' : ''}`}
              style={{ width: 120 }}
              type="number"
              min={0}
              value={(editor.heightMode || 'auto') === 'fixed' ? (editor.heightPx ?? '') : ''}
              onChange={(e) => update('heightPx', e.target.value)}
              placeholder="px"
              disabled={(editor.heightMode || 'auto') !== 'fixed'}
            />
          </div>
          {errors.heightPx ? <div className="aw-error-text">{errors.heightPx}</div> : null}
        </div>
      </div>

      {/* --- Viditelnost sekci --- */}
      <div className="aw-config-section">
        <div className="aw-config-section-title">Viditelnost sekci</div>
        <div className="aw-muted" style={{ marginBottom: 10 }}>
          Zvolte ktere sekce se budou v widgetu zobrazovat.
        </div>

        <div className="aw-section-toggles">
          <label className="aw-section-toggle-row">
            <ForgeCheckbox
              checked={sections.upload !== false}
              onChange={(e) => updateSection('upload', e.target.checked)}
            />
            <div>
              <div className="aw-section-toggle-label">Nahrani souboru</div>
              <div className="aw-muted">Upload zona pro 3D modely (STL, OBJ, 3MF)</div>
            </div>
          </label>

          <label className="aw-section-toggle-row">
            <ForgeCheckbox
              checked={sections.materials !== false}
              onChange={(e) => updateSection('materials', e.target.checked)}
            />
            <div>
              <div className="aw-section-toggle-label">Materialy</div>
              <div className="aw-muted">Vyber materialu a barev</div>
            </div>
          </label>

          <label className="aw-section-toggle-row">
            <ForgeCheckbox
              checked={sections.pricingBreakdown !== false}
              onChange={(e) => updateSection('pricingBreakdown', e.target.checked)}
            />
            <div>
              <div className="aw-section-toggle-label">Rozpis ceny</div>
              <div className="aw-muted">Detailni rozdeleni ceny (material, prace, poplatky)</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigTab;
