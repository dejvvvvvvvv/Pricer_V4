import React from 'react';

export default function SlicerViewport({ children }) {
  return (
    <div style={{
      gridArea: 'viewport',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--forge-bg-void, #08090C)',
      backgroundImage: `
        repeating-linear-gradient(
          0deg,
          var(--forge-border-grid, #141720) 0px,
          var(--forge-border-grid, #141720) 1px,
          transparent 1px,
          transparent 50px
        ),
        repeating-linear-gradient(
          90deg,
          var(--forge-border-grid, #141720) 0px,
          var(--forge-border-grid, #141720) 1px,
          transparent 1px,
          transparent 50px
        )
      `,
    }}>
      {/* Build plate circle */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        border: '1.5px solid var(--forge-accent-primary, #00D4AA)',
        opacity: 0.4,
        background: 'radial-gradient(circle, var(--forge-accent-primary-ghost, rgba(0,212,170,0.06)) 0%, transparent 70%)',
      }} />

      {/* Center crosshair */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--forge-accent-primary, #00D4AA)',
        opacity: 0.3,
      }} />

      {/* Floating panels go here */}
      {children}
    </div>
  );
}
