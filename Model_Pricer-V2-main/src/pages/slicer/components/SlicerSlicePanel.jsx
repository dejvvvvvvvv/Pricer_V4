import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { SLICER_MOCK } from '../mockData';

export default function SlicerSlicePanel() {
  const [method, setMethod] = useState('auto');

  return (
    <div style={{
      position: 'absolute',
      bottom: '12px',
      right: '12px',
      width: '280px',
      background: 'var(--forge-bg-surface, #0E1015)',
      border: '1px solid var(--forge-border-default, #1E2230)',
      borderRadius: 'var(--forge-radius-lg, 8px)',
      boxShadow: 'var(--forge-shadow-lg)',
      zIndex: 10,
      padding: '14px',
    }}>
      {/* Header */}
      <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--forge-font-heading)', color: 'var(--forge-text-primary, #E8ECF1)', marginBottom: '4px' }}>
        Select slicing method
      </div>
      <div style={{ fontSize: '11px', color: 'var(--forge-text-muted, #7A8291)', marginBottom: '12px' }}>
        Selected object: {SLICER_MOCK.object.filename}
      </div>

      {/* Radio options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {/* AI Auto-Slice */}
        <button onClick={() => setMethod('auto')} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 10px',
          background: method === 'auto' ? 'var(--forge-accent-primary-ghost, rgba(0,212,170,0.06))' : 'transparent',
          border: `1px solid ${method === 'auto' ? 'var(--forge-accent-primary, #00D4AA)' : 'var(--forge-border-default, #1E2230)'}`,
          borderRadius: 'var(--forge-radius-md, 6px)',
          cursor: 'pointer', textAlign: 'left', width: '100%',
        }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: method === 'auto' ? 'var(--forge-accent-primary, #00D4AA)' : 'transparent',
            border: method === 'auto' ? 'none' : '2px solid var(--forge-border-default, #1E2230)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {method === 'auto' && <Check size={12} style={{ color: '#08090C' }} />}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--forge-text-primary, #E8ECF1)', fontWeight: 500 }}>AI Auto-Slice</span>
        </button>

        {/* Manual slicing */}
        <button onClick={() => setMethod('manual')} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 10px',
          background: method === 'manual' ? 'var(--forge-accent-primary-ghost, rgba(0,212,170,0.06))' : 'transparent',
          border: `1px solid ${method === 'manual' ? 'var(--forge-accent-primary, #00D4AA)' : 'var(--forge-border-default, #1E2230)'}`,
          borderRadius: 'var(--forge-radius-md, 6px)',
          cursor: 'pointer', textAlign: 'left', width: '100%',
        }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: method === 'manual' ? 'var(--forge-accent-primary, #00D4AA)' : 'transparent',
            border: method === 'manual' ? 'none' : '2px solid var(--forge-border-default, #1E2230)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {method === 'manual' && <Check size={12} style={{ color: '#08090C' }} />}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--forge-text-primary, #E8ECF1)', fontWeight: 500 }}>Manual slicing</span>
        </button>
      </div>

      {/* Slice button */}
      <button style={{
        width: '100%',
        padding: '12px',
        background: 'var(--forge-accent-primary, #00D4AA)',
        border: 'none',
        borderRadius: 'var(--forge-radius-md, 6px)',
        color: '#08090C',
        fontSize: '14px',
        fontWeight: 700,
        fontFamily: 'var(--forge-font-heading)',
        cursor: 'pointer',
        letterSpacing: '0.02em',
        transition: 'background 150ms',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--forge-accent-primary-h, #00F0C0)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--forge-accent-primary, #00D4AA)'}
      >
        Slice
      </button>
    </div>
  );
}
