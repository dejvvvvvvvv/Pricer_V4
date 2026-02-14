import React, { useState } from 'react';
import { Download, FlipHorizontal2, RotateCw, Maximize, ScanSearch, Lock, ChevronDown } from 'lucide-react';
import SlicerAxisGizmo from './SlicerAxisGizmo';
import { SLICER_MOCK } from '../mockData';

const DarkSelect = ({ label, value, options }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {label && (
        <div style={{ fontSize: '11px', color: 'var(--forge-text-muted, #7A8291)', marginBottom: '4px', fontFamily: 'var(--forge-font-body)' }}>{label}</div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '8px 10px',
          background: 'var(--forge-bg-elevated, #161920)',
          border: '1px solid var(--forge-border-default, #1E2230)',
          borderRadius: 'var(--forge-radius-md, 6px)',
          color: 'var(--forge-text-primary, #E8ECF1)',
          fontSize: '13px',
          fontFamily: 'var(--forge-font-body)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <span>{selected?.label || 'Select...'}</span>
        <ChevronDown size={14} style={{ color: 'var(--forge-text-muted, #7A8291)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'var(--forge-bg-elevated, #161920)',
          border: '1px solid var(--forge-border-default, #1E2230)',
          borderRadius: 'var(--forge-radius-md, 6px)',
          zIndex: 50,
          boxShadow: 'var(--forge-shadow-md)',
          overflow: 'hidden',
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => setOpen(false)}
              style={{
                padding: '8px 10px',
                fontSize: '13px',
                color: opt.value === value ? 'var(--forge-accent-primary, #00D4AA)' : 'var(--forge-text-primary, #E8ECF1)',
                cursor: 'pointer',
                background: opt.value === value ? 'var(--forge-accent-primary-ghost, rgba(0,212,170,0.06))' : 'transparent',
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = 'var(--forge-bg-overlay, #1C1F28)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = opt.value === value ? 'var(--forge-accent-primary-ghost, rgba(0,212,170,0.06))' : 'transparent'; }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DarkInput = ({ label, value, suffix, icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    {icon && <span style={{ color: 'var(--forge-text-muted, #7A8291)' }}>{icon}</span>}
    <span style={{ fontSize: '11px', color: 'var(--forge-text-muted, #7A8291)', width: '14px', fontWeight: 600 }}>{label}</span>
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      background: 'var(--forge-bg-elevated, #161920)',
      border: '1px solid var(--forge-border-default, #1E2230)',
      borderRadius: 'var(--forge-radius-sm, 4px)',
      padding: '5px 8px',
    }}>
      <input
        readOnly
        value={value}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--forge-text-primary, #E8ECF1)',
          fontSize: '12px',
          fontFamily: 'var(--forge-font-tech)',
          width: '100%',
        }}
      />
      {suffix && <span style={{ fontSize: '10px', color: 'var(--forge-text-muted, #7A8291)', marginLeft: '4px' }}>{suffix}</span>}
    </div>
  </div>
);

const tools = [
  { icon: Download, tip: 'Import' },
  { icon: FlipHorizontal2, tip: 'Mirror' },
  { icon: RotateCw, tip: 'Rotate' },
  { icon: Maximize, tip: 'Scale' },
  { icon: ScanSearch, tip: 'Measure' },
];

export default function SlicerLeftPanel() {
  return (
    <div style={{
      gridArea: 'left',
      background: 'var(--forge-bg-surface, #0E1015)',
      borderRight: '1px solid var(--forge-border-default, #1E2230)',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      overflowY: 'auto',
    }}>
      {/* Printer selector */}
      <DarkSelect label="Printer" value={SLICER_MOCK.printer.value} options={SLICER_MOCK.printerOptions} />

      {/* Axis gizmo */}
      <div style={{ padding: '8px 0' }}>
        <SlicerAxisGizmo />
      </div>

      {/* Tool buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {tools.map(({ icon: Icon, tip }) => (
          <button
            key={tip}
            title={tip}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--forge-bg-elevated, #161920)',
              border: '1px solid var(--forge-border-default, #1E2230)',
              borderRadius: 'var(--forge-radius-md, 6px)',
              cursor: 'pointer',
              color: 'var(--forge-text-secondary, #9BA3B0)',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--forge-accent-primary, #00D4AA)';
              e.currentTarget.style.color = 'var(--forge-accent-primary, #00D4AA)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--forge-border-default, #1E2230)';
              e.currentTarget.style.color = 'var(--forge-text-secondary, #9BA3B0)';
            }}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      {/* Position inputs */}
      <div>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--forge-text-secondary, #9BA3B0)',
          marginBottom: '8px',
          fontFamily: 'var(--forge-font-heading)',
        }}>Position</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <DarkInput label="X" value={SLICER_MOCK.position.x} suffix="mm" icon={<Lock size={10} />} />
          <DarkInput label="Y" value={SLICER_MOCK.position.y} suffix="mm" icon={<Lock size={10} />} />
          <DarkInput label="Z" value={SLICER_MOCK.position.z} suffix="mm" icon={<Lock size={10} />} />
        </div>
      </div>
    </div>
  );
}
