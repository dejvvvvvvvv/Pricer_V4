import React, { useState } from 'react';
import SlicerPillTabs from './SlicerPillTabs';

export default function SlicerTopBar() {
  const [activeTab, setActiveTab] = useState('Workshop');

  return (
    <div style={{
      gridArea: 'topbar',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      background: 'var(--forge-bg-surface, #0E1015)',
      borderBottom: '1px solid var(--forge-border-default, #1E2230)',
      height: '52px',
      minHeight: '52px',
    }}>
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          background: 'var(--forge-accent-primary, #00D4AA)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 700,
          color: '#08090C',
        }}>F</div>
        <span style={{
          fontSize: '15px',
          fontWeight: 700,
          fontFamily: 'var(--forge-font-heading)',
          color: 'var(--forge-text-primary, #E8ECF1)',
          letterSpacing: '0.05em',
        }}>FORGE</span>
      </div>

      {/* Center: Tabs */}
      <SlicerPillTabs
        tabs={['Workshop', 'Viewer', 'Monitor']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Right: User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'var(--forge-bg-elevated, #161920)',
          border: '1px solid var(--forge-border-default, #1E2230)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: 'var(--forge-text-secondary, #9BA3B0)',
        }}>A</div>
        <span style={{
          fontSize: '13px',
          color: 'var(--forge-text-secondary, #9BA3B0)',
        }}>Admin</span>
      </div>
    </div>
  );
}
