import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import SlicerPillTabs from './SlicerPillTabs';
import { SLICER_MOCK } from '../mockData';

const DarkSelect = ({ label, value, options }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <div style={{ position: 'relative' }}>
      {label && <div style={{ fontSize: '11px', color: 'var(--forge-text-muted, #7A8291)', marginBottom: '4px' }}>{label}</div>}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '7px 10px',
          background: 'var(--forge-bg-elevated, #161920)',
          border: '1px solid var(--forge-border-default, #1E2230)',
          borderRadius: 'var(--forge-radius-md, 6px)',
          color: 'var(--forge-text-primary, #E8ECF1)',
          fontSize: '12px',
          fontFamily: 'var(--forge-font-body)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <span>{selected?.label || 'Select...'}</span>
        <ChevronDown size={12} style={{ color: 'var(--forge-text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
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
            <div key={opt.value} onClick={() => setOpen(false)}
              style={{ padding: '7px 10px', fontSize: '12px', cursor: 'pointer',
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

export default function SlicerMaterialsPanel() {
  const [activeTab, setActiveTab] = useState('Material 1');
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '340px',
      background: 'var(--forge-bg-surface, #0E1015)',
      border: '1px solid var(--forge-border-default, #1E2230)',
      borderRadius: 'var(--forge-radius-lg, 8px)',
      boxShadow: 'var(--forge-shadow-lg)',
      zIndex: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--forge-text-primary, #E8ECF1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--forge-accent-primary, #00D4AA)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--forge-font-heading)' }}>Materials</span>
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Material slots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            {SLICER_MOCK.materials.map((mat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: 'var(--forge-radius-sm, 4px)', background: 'var(--forge-bg-elevated, #161920)' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: mat.color, border: '1px solid var(--forge-border-default)' }} />
                <span style={{ fontSize: '12px', color: 'var(--forge-text-primary)', flex: 1 }}>{mat.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--forge-text-muted, #7A8291)', fontFamily: 'var(--forge-font-tech)' }}>{mat.spec}</span>
              </div>
            ))}
          </div>

          {/* Pill tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <SlicerPillTabs tabs={['Material 1', 'Material 2']} activeTab={activeTab} onTabChange={setActiveTab} size="sm" />
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--forge-border-default, #1E2230)' }} />
            <span style={{ fontSize: '10px', color: 'var(--forge-text-muted, #7A8291)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settings</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--forge-border-default, #1E2230)' }} />
          </div>

          {/* Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <DarkToggle label="Enable" checked={true} />
            <DarkSelect label="Material" value="black-abs" options={SLICER_MOCK.materialOptions} />
            <DarkSelect label="Print core" value="aa-08" options={SLICER_MOCK.printCoreOptions} />
          </div>
        </div>
      )}
    </div>
  );
}
