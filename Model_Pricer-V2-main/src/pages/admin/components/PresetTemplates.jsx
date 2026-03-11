import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import { getDefaultPresets } from '../../../services/presetsApi';

/**
 * Preset Templates — quick-create from PrusaSlicer default profiles.
 * Shows material, quality, key settings preview, one-click create.
 *
 * Props:
 *   onCreateFromTemplate: (template) => void
 *   language: 'cs' | 'en'
 *   disabled: boolean
 */

function pickLang(language, cs, en) {
  return String(language || '').toLowerCase().startsWith('en') ? en : cs;
}

const MATERIAL_COLORS = {
  PLA: { bg: 'rgba(0,212,170,0.10)', border: 'rgba(0,212,170,0.3)', color: 'var(--forge-accent-primary)' },
  PETG: { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.3)', color: '#3B82F6' },
  ABS: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.3)', color: '#F59E0B' },
  TPU: { bg: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.3)', color: '#A855F7' },
};

const MATERIAL_ICONS = {
  PLA: 'Layers',
  PETG: 'Shield',
  ABS: 'Flame',
  TPU: 'Move',
};

function getQualityLabel(quality, language) {
  const map = {
    draft: pickLang(language, 'Navrh', 'Draft'),
    quality: pickLang(language, 'Kvalita', 'Quality'),
    fine: pickLang(language, 'Jemny', 'Fine'),
    ultra: pickLang(language, 'Ultra', 'Ultra'),
  };
  return map[quality] || quality || '';
}

export default function PresetTemplates({ onCreateFromTemplate, language = 'cs', disabled = false }) {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [collapsed, setCollapsed] = useState(true);
  const [creatingId, setCreatingId] = useState(null);

  useEffect(() => {
    if (collapsed) return;
    if (templates.length > 0) return;
    loadTemplates();
  }, [collapsed]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    setLoadError('');
    const res = await getDefaultPresets();
    if (res.ok && Array.isArray(res.data?.presets)) {
      setTemplates(res.data.presets);
    } else {
      setLoadError(res.message || 'Failed to load templates');
    }
    setLoadingTemplates(false);
  };

  const handleCreate = async (template) => {
    if (disabled || creatingId) return;
    setCreatingId(template.id);
    try {
      await onCreateFromTemplate(template);
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <div style={styles.container}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={styles.toggleBtn}
        aria-expanded={!collapsed}
      >
        <div style={styles.toggleLeft}>
          <Icon name="BookTemplate" size={16} style={{ color: 'var(--forge-accent-primary)' }} />
          <span style={styles.toggleTitle}>
            {pickLang(language, 'Sablony presetu', 'Preset Templates')}
          </span>
          <span style={styles.toggleHint}>
            {pickLang(language, 'Rychle vytvoreni z PrusaSlicer profilu', 'Quick create from PrusaSlicer profiles')}
          </span>
        </div>
        <Icon
          name={collapsed ? 'ChevronDown' : 'ChevronUp'}
          size={16}
          style={{ color: 'var(--forge-text-muted)' }}
        />
      </button>

      {!collapsed && (
        <div style={styles.content}>
          {loadingTemplates && (
            <div style={styles.loadingRow}>
              <Icon name="Loader2" size={16} className="spin" style={{ color: 'var(--forge-text-muted)' }} />
              <span style={{ color: 'var(--forge-text-muted)', fontSize: 13 }}>
                {pickLang(language, 'Nacitam sablony...', 'Loading templates...')}
              </span>
            </div>
          )}

          {loadError && (
            <div style={styles.errorRow}>
              <Icon name="AlertCircle" size={14} style={{ color: 'var(--forge-error)' }} />
              <span style={{ color: 'var(--forge-error)', fontSize: 13 }}>{loadError}</span>
              <button onClick={loadTemplates} style={styles.retryBtn}>
                <Icon name="RefreshCcw" size={12} />
                {pickLang(language, 'Zkusit znovu', 'Retry')}
              </button>
            </div>
          )}

          {!loadingTemplates && !loadError && templates.length > 0 && (
            <div style={styles.grid}>
              {templates.map(t => {
                const matColors = MATERIAL_COLORS[t.material] || MATERIAL_COLORS.PLA;
                const matIcon = MATERIAL_ICONS[t.material] || 'Layers';
                const isCreating = creatingId === t.id;

                return (
                  <div key={t.id} style={{
                    ...styles.card,
                    borderColor: matColors.border,
                  }}>
                    {/* Header */}
                    <div style={styles.cardHeader}>
                      <div style={{
                        ...styles.materialBadge,
                        background: matColors.bg,
                        borderColor: matColors.border,
                        color: matColors.color,
                      }}>
                        <Icon name={matIcon} size={12} />
                        {t.material}
                      </div>
                      <div style={{
                        ...styles.qualityBadge,
                      }}>
                        {getQualityLabel(t.quality, language)}
                      </div>
                    </div>

                    {/* Name */}
                    <div style={styles.cardName}>{t.name}</div>
                    {t.description && (
                      <div style={styles.cardDesc}>{t.description}</div>
                    )}

                    {/* Key settings preview */}
                    <div style={styles.settingsGrid}>
                      <div style={styles.settingItem}>
                        <span style={styles.settingLabel}>
                          {pickLang(language, 'Vrstva', 'Layer')}
                        </span>
                        <span style={styles.settingValue}>{t.layerHeight} mm</span>
                      </div>
                      <div style={styles.settingItem}>
                        <span style={styles.settingLabel}>Infill</span>
                        <span style={styles.settingValue}>{t.infillDensity}%</span>
                      </div>
                      <div style={styles.settingItem}>
                        <span style={styles.settingLabel}>
                          {pickLang(language, 'Rychlost', 'Speed')}
                        </span>
                        <span style={styles.settingValue}>{t.printSpeed} mm/s</span>
                      </div>
                      <div style={styles.settingItem}>
                        <span style={styles.settingLabel}>
                          {pickLang(language, 'Teplota', 'Temp')}
                        </span>
                        <span style={styles.settingValue}>{t.temperature}°C</span>
                      </div>
                      <div style={styles.settingItem}>
                        <span style={styles.settingLabel}>
                          {pickLang(language, 'Podlozka', 'Bed')}
                        </span>
                        <span style={styles.settingValue}>{t.bedTemperature}°C</span>
                      </div>
                      <div style={styles.settingItem}>
                        <span style={styles.settingLabel}>
                          {pickLang(language, 'Supporty', 'Supports')}
                        </span>
                        <span style={styles.settingValue}>
                          {t.supports ? pickLang(language, 'Ano', 'Yes') : pickLang(language, 'Ne', 'No')}
                        </span>
                      </div>
                    </div>

                    {/* Create button */}
                    <button
                      onClick={() => handleCreate(t)}
                      disabled={disabled || isCreating}
                      style={{
                        ...styles.createBtn,
                        borderColor: matColors.border,
                        color: matColors.color,
                      }}
                    >
                      {isCreating
                        ? <Icon name="Loader2" size={14} className="spin" />
                        : <Icon name="Plus" size={14} />
                      }
                      {pickLang(language, 'Vytvorit preset', 'Create preset')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md, 8px)',
    background: 'var(--forge-bg-surface)',
    overflow: 'hidden',
    marginTop: 12,
  },
  toggleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: 'var(--forge-text-primary)',
  },
  toggleLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'var(--forge-font-heading)',
  },
  toggleHint: {
    fontSize: 12,
    color: 'var(--forge-text-muted)',
    fontWeight: 400,
  },
  content: {
    padding: '0 16px 16px',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '16px 0',
  },
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 0',
  },
  retryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    color: 'var(--forge-text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    marginLeft: 8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 12,
  },
  card: {
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md, 8px)',
    background: 'var(--forge-bg-elevated)',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'border-color 0.15s',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  materialBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    fontFamily: 'var(--forge-font-tech)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    border: '1px solid',
  },
  qualityBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-tech)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardName: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-heading)',
  },
  cardDesc: {
    fontSize: 12,
    color: 'var(--forge-text-muted)',
    lineHeight: 1.4,
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '4px 12px',
    marginTop: 4,
  },
  settingItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  settingLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-tech)',
  },
  settingValue: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-tech)',
  },
  createBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border-default)',
    background: 'transparent',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
    transition: 'all 0.15s',
    opacity: 1,
  },
};
