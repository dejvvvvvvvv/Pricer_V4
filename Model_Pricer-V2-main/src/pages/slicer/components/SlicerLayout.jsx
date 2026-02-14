import React from 'react';

export default function SlicerLayout({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '52px 1fr',
      gridTemplateColumns: '260px 1fr 320px',
      gridTemplateAreas: '"topbar topbar topbar" "left viewport right"',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: 'var(--forge-bg-void, #08090C)',
      color: 'var(--forge-text-primary, #E8ECF1)',
      fontFamily: 'var(--forge-font-body)',
    }}>
      {children}
    </div>
  );
}
