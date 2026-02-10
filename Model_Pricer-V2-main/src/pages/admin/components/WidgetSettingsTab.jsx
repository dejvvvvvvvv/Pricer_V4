import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

/**
 * WidgetSettingsTab -- Tab 4: Enable/disable, builder CTA, duplicate, delete.
 *
 * Props:
 *   widget           - the selected widget object
 *   canCreateMore    - boolean (can duplicate?)
 *   onToggleEnabled  - (widgetId) => void
 *   onDuplicate      - (widgetId) => void
 *   onDelete         - (widgetId) => void
 *   onNavigateBuilder - (widgetId) => void
 */
const WidgetSettingsTab = ({
  widget,
  canCreateMore,
  onToggleEnabled,
  onDuplicate,
  onDelete,
  onNavigateBuilder,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!widget) return null;

  const isActive = widget.status !== 'disabled';

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(widget.id);
    setConfirmDelete(false);
  };

  return (
    <div className="aw-settings-tab">
      {/* Enable/Disable */}
      <div className="aw-settings-section">
        <div className="aw-settings-row">
          <div>
            <div className="aw-settings-label">Stav widgetu</div>
            <div className="aw-muted">
              {isActive
                ? 'Widget je aktivni a zobrazuje se na vasem webu.'
                : 'Widget je deaktivovany a nebude se zobrazovat.'}
            </div>
          </div>
          <label className="aw-toggle aw-toggle-large">
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => onToggleEnabled(widget.id)}
            />
            <span />
          </label>
        </div>
        <div className={`aw-status-indicator ${isActive ? 'aw-status-active' : 'aw-status-disabled'}`}>
          <div className={`aw-status-dot ${isActive ? 'aw-dot-green' : 'aw-dot-grey'}`} />
          {isActive ? 'Aktivni' : 'Neaktivni'}
        </div>
      </div>

      {/* Builder CTA */}
      <div className="aw-settings-section">
        <div className="aw-settings-label">Vizualni editor</div>
        <div className="aw-muted" style={{ marginBottom: 10 }}>
          Otevrete Widget Builder pro vizualni upravu vzhledu widgetu -- barvy, zaobleni, fonty a dalsi.
        </div>
        <button
          className="aw-btn aw-btn-primary aw-btn-large"
          onClick={() => onNavigateBuilder(widget.id)}
        >
          <Icon name="Palette" size={18} />
          Otevrit Builder
        </button>
      </div>

      {/* Duplicate */}
      <div className="aw-settings-section">
        <div className="aw-settings-label">Duplikovat widget</div>
        <div className="aw-muted" style={{ marginBottom: 10 }}>
          Vytvori kopii tohoto widgetu vcetne vsech nastaveni.
        </div>
        <button
          className="aw-btn aw-btn-secondary"
          onClick={() => onDuplicate(widget.id)}
          disabled={!canCreateMore}
        >
          <Icon name="CopyPlus" size={16} />
          Duplikovat
        </button>
        {!canCreateMore ? (
          <div className="aw-muted" style={{ marginTop: 6 }}>
            Dosazeny limit tarifu -- nelze vytvorit dalsi widget.
          </div>
        ) : null}
      </div>

      {/* Delete */}
      <div className="aw-settings-section aw-settings-danger">
        <div className="aw-settings-label" style={{ color: '#f87171' }}>Smazat widget</div>
        <div className="aw-muted" style={{ marginBottom: 10 }}>
          Trvale smaze widget a vsechny jeho nastaveni. Tuto akci nelze vratit.
        </div>
        {confirmDelete ? (
          <div className="aw-delete-confirm">
            <span style={{ fontWeight: 700, color: '#f87171' }}>
              Opravdu smazat "{widget.name}"?
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="aw-btn aw-btn-secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Zrusit
              </button>
              <button
                className="aw-btn aw-btn-danger"
                onClick={handleDelete}
              >
                <Icon name="Trash2" size={16} />
                Ano, smazat
              </button>
            </div>
          </div>
        ) : (
          <button className="aw-btn aw-btn-danger" onClick={handleDelete}>
            <Icon name="Trash2" size={16} />
            Smazat widget
          </button>
        )}
      </div>
    </div>
  );
};

export default WidgetSettingsTab;
