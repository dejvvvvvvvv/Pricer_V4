import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Trash2, Box } from 'lucide-react';
import { SLICER_MOCK } from '../mockData';

export default function SlicerObjectsPanel() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{
      position: 'absolute',
      bottom: '60px',
      left: '12px',
      width: '260px',
      background: 'var(--forge-bg-surface, #0E1015)',
      border: '1px solid var(--forge-border-default, #1E2230)',
      borderRadius: 'var(--forge-radius-lg, 8px)',
      boxShadow: 'var(--forge-shadow-lg)',
      zIndex: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        borderBottom: '1px solid var(--forge-border-default, #1E2230)',
      }}>
        <button onClick={() => setExpanded(!expanded)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--forge-text-muted, #7A8291)', padding: 0, display: 'flex',
        }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--forge-font-heading)', color: 'var(--forge-text-primary, #E8ECF1)' }}>Objects</span>
      </div>

      {expanded && (
        <div style={{ padding: '8px 12px' }}>
          {/* File row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 0',
          }}>
            <ChevronDown size={12} style={{ color: 'var(--forge-text-muted)' }} />
            <Box size={14} style={{ color: 'var(--forge-accent-primary, #00D4AA)' }} />
            <span style={{
              fontSize: '12px',
              color: 'var(--forge-text-primary, #E8ECF1)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{SLICER_MOCK.object.filename}</span>
            <Trash2 size={13} style={{ color: 'var(--forge-text-muted, #7A8291)', cursor: 'pointer', flexShrink: 0 }} />
          </div>

          {/* Dimensions */}
          <div style={{ paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
            {Object.entries(SLICER_MOCK.object.dimensions).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--forge-text-muted, #7A8291)', textTransform: 'capitalize' }}>{key}:</span>
                <span style={{ fontSize: '11px', color: 'var(--forge-text-secondary, #9BA3B0)', fontFamily: 'var(--forge-font-tech)' }}>{val} mm</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
