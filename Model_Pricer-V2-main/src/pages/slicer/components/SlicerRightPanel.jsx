import React, { useState } from 'react';
import { Settings, Eye, Scale, Zap, ChevronUp } from 'lucide-react';
import SlicerPillTabs from './SlicerPillTabs';
import { SLICER_MOCK } from '../mockData';

const iconMap = { Scale, Eye, Settings, Zap };

const DarkSelect = ({ label, value, options }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <div style={{ position: 'relative' }}>
      {label && <div style={{ fontSize: '11px', color: 'var(--forge-text-muted, #7A8291)', marginBottom: '4px' }}>{label}</div>}
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '7px 10px',
        background: 'var(--forge-bg-elevated, #161920)',
        border: '1px solid var(--forge-border-default, #1E2230)',
        borderRadius: 'var(--forge-radius-md, 6px)',
        color: 'var(--forge-text-primary, #E8ECF1)',
        fontSize: '12px', fontFamily: 'var(--forge-font-body)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
      }}>
        <span>{selected?.label || 'Select...'}</span>
        <ChevronUp size={12} style={{ color: 'var(--forge-text-muted)', transform: open ? 'none' : 'rotate(180deg)', transition: 'transform 150ms' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '2px',
          background: 'var(--forge-bg-elevated, #161920)',
          border: '1px solid var(--forge-border-default, #1E2230)',
          borderRadius: 'var(--forge-radius-md, 6px)',
          zIndex: 50, boxShadow: 'var(--forge-shadow-md)',
        }}>
          {options.map(opt => (
            <div key={opt.value} onClick={() => setOpen(false)} style={{
              padding: '7px 10px', fontSize: '12px', cursor: 'pointer',
              color: opt.value === value ? 'var(--forge-accent-primary)' : 'var(--forge-text-primary)',
              background: opt.value === value ? 'var(--forge-accent-primary-ghost)' : 'transparent',
            }}
            onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = 'var(--forge-bg-overlay, #1C1F28)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = opt.value === value ? 'var(--forge-accent-primary-ghost)' : 'transparent'; }}
            >{opt.label}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const DarkToggle = ({ label, checked }) => {
  const [on, setOn] = useState(checked);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '12px', color: 'var(--forge-text-secondary, #9BA3B0)' }}>{label}</span>
      <button onClick={() => setOn(!on)} style={{
        width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', position: 'relative',
        background: on ? 'var(--forge-accent-primary, #00D4AA)' : 'var(--forge-bg-overlay, #1C1F28)',
        transition: 'background 150ms',
      }}>
        <div style={{
          width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px',
          left: on ? '18px' : '2px', transition: 'left 150ms',
        }} />
      </button>
    </div>
  );
};

const DarkSlider = ({ value, min, max, label }) => (
  <div>
    {label && <div style={{ fontSize: '11px', color: 'var(--forge-text-muted, #7A8291)', marginBottom: '6px' }}>{label}</div>}
    <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
      <input
        type="range"
        min={min}
        max={max}
        defaultValue={value}
        style={{
          width: '100%',
          height: '4px',
          WebkitAppearance: 'none',
          appearance: 'none',
          background: `linear-gradient(to right, var(--forge-accent-primary, #00D4AA) ${(value / max) * 100}%, var(--forge-bg-overlay, #1C1F28) ${(value / max) * 100}%)`,
          borderRadius: '2px',
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  </div>
);

const DarkInput = ({ value, suffix, label }) => (
  <div style={{ flex: 1 }}>
    {label && <div style={{ fontSize: '10px', color: 'var(--forge-text-muted, #7A8291)', marginBottom: '3px' }}>{label}</div>}
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--forge-bg-elevated, #161920)',
      border: '1px solid var(--forge-border-default, #1E2230)',
      borderRadius: 'var(--forge-radius-sm, 4px)',
      padding: '5px 8px',
    }}>
      <input readOnly value={value} style={{
        background: 'transparent', border: 'none', outline: 'none',
        color: 'var(--forge-text-primary, #E8ECF1)',
        fontSize: '12px', fontFamily: 'var(--forge-font-tech)',
        width: '100%',
      }} />
      {suffix && <span style={{ fontSize: '10px', color: 'var(--forge-text-muted)', marginLeft: '4px' }}>{suffix}</span>}
    </div>
  </div>
);

const SectionDivider = ({ text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0 8px' }}>
    <div style={{ flex: 1, height: '1px', background: 'var(--forge-border-default, #1E2230)' }} />
    <span style={{ fontSize: '10px', color: 'var(--forge-text-muted, #7A8291)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{text}</span>
    <div style={{ flex: 1, height: '1px', background: 'var(--forge-border-default, #1E2230)' }} />
  </div>
);

const SectionHeader = ({ title, badge, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)' }}>{title}</span>
      {badge && (
        <span style={{
          fontSize: '10px', fontFamily: 'var(--forge-font-tech)',
          padding: '2px 6px', borderRadius: '8px',
          background: 'var(--forge-accent-primary, #00D4AA)',
          color: '#08090C', fontWeight: 600,
        }}>{badge}</span>
      )}
    </div>
    {children}
  </div>
);

const Tag = ({ text }) => (
  <span style={{
    padding: '3px 8px',
    borderRadius: '12px',
    background: 'var(--forge-bg-elevated, #161920)',
    fontSize: '11px',
    fontFamily: 'var(--forge-font-tech)',
    color: 'var(--forge-text-secondary, #9BA3B0)',
    whiteSpace: 'nowrap',
  }}>{text}</span>
);

const RadioOption = ({ color, label, selected }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer' }}>
    <div style={{
      width: '18px', height: '18px', borderRadius: '50%',
      background: color,
      border: selected ? '2px solid var(--forge-accent-primary, #00D4AA)' : '2px solid var(--forge-border-default, #1E2230)',
      boxShadow: selected ? '0 0 0 2px var(--forge-accent-primary-ghost)' : 'none',
    }} />
    <span style={{ fontSize: '12px', color: selected ? 'var(--forge-text-primary)' : 'var(--forge-text-secondary)' }}>{label}</span>
  </div>
);

export default function SlicerRightPanel() {
  const [presetTab, setPresetTab] = useState('Recommended');

  return (
    <div style={{
      gridArea: 'right',
      background: 'var(--forge-bg-surface, #0E1015)',
      borderLeft: '1px solid var(--forge-border-default, #1E2230)',
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={16} style={{ color: 'var(--forge-text-muted)' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--forge-font-heading)', color: 'var(--forge-text-primary)' }}>Print Settings</span>
        </div>
        <ChevronUp size={14} style={{ color: 'var(--forge-text-muted)' }} />
      </div>

      {/* Summary tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        <Tag text="Fast 0.2 mm" />
        <Tag text="Infill 20%" />
        <Tag text="Support ON" />
        <Tag text="Adhesion ON" />
      </div>

      {/* Recommended/Custom tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <SlicerPillTabs tabs={['Recommended', 'Custom']} activeTab={presetTab} onTabChange={setPresetTab} size="sm" />
      </div>

      {/* Preset cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
        {SLICER_MOCK.presets.map(p => {
          const Icon = iconMap[p.icon] || Settings;
          const isSelected = p.key === SLICER_MOCK.selectedPreset;
          return (
            <div key={p.key} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '10px 4px',
              background: 'var(--forge-bg-elevated, #161920)',
              border: `1.5px solid ${isSelected ? 'var(--forge-accent-primary, #00D4AA)' : 'var(--forge-border-default, #1E2230)'}`,
              borderRadius: 'var(--forge-radius-lg, 8px)',
              cursor: 'pointer',
              gap: '6px',
              minHeight: '70px',
            }}>
              <Icon size={18} style={{ color: isSelected ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)' }} />
              <span style={{
                fontSize: '10px', fontWeight: 500,
                color: isSelected ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
              }}>{p.label}</span>
            </div>
          );
        })}
      </div>

      {/* Resolution */}
      <DarkSelect label="Resolution" value="normal" options={SLICER_MOCK.resolutionOptions} />

      <SectionDivider text="Settings" />

      {/* Infill */}
      <SectionHeader title="Infill" badge={`${SLICER_MOCK.infill.density}%`} />
      <DarkSlider label="Density" value={SLICER_MOCK.infill.density} min={0} max={100} />
      <div style={{ marginTop: '8px' }}>
        <DarkSelect label="Pattern" value={SLICER_MOCK.infill.pattern} options={SLICER_MOCK.patternOptions} />
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <DarkInput label="Wall" value={SLICER_MOCK.shell.wall} suffix="mm" />
        <DarkInput label="Top/Bottom" value={SLICER_MOCK.shell.topBottom} suffix="mm" />
      </div>

      <SectionDivider text="" />

      {/* Support */}
      <SectionHeader title="Support">
        <DarkToggle checked={SLICER_MOCK.support.enabled} />
      </SectionHeader>
      <DarkSelect label="Support type" value={SLICER_MOCK.support.type} options={SLICER_MOCK.supportTypeOptions} />
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginBottom: '4px' }}>Print with:</div>
        <RadioOption color="#1a1a1a" label="Black ABS AA 0.8" selected={true} />
        <RadioOption color="#f0f0f0" label="White PLA AA 0.25" selected={false} />
      </div>
      <div style={{ marginTop: '8px' }}>
        <DarkSelect label="Placement" value={SLICER_MOCK.support.placement} options={SLICER_MOCK.placementOptions} />
      </div>

      <SectionDivider text="" />

      {/* Adhesion */}
      <SectionHeader title="Adhesion">
        <DarkToggle checked={SLICER_MOCK.adhesion.enabled} />
      </SectionHeader>
    </div>
  );
}
