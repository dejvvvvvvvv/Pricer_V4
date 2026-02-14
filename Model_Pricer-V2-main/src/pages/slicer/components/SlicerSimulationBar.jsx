import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { SLICER_MOCK } from '../mockData';

export default function SlicerSimulationBar() {
  const [speed, setSpeed] = useState(SLICER_MOCK.simulation.speed);
  const sim = SLICER_MOCK.simulation;

  return (
    <div style={{
      position: 'absolute',
      bottom: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--forge-bg-surface, #0E1015)',
      border: '1px solid var(--forge-border-default, #1E2230)',
      borderRadius: 'var(--forge-radius-lg, 8px)',
      boxShadow: 'var(--forge-shadow-lg)',
      zIndex: 10,
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      whiteSpace: 'nowrap',
    }}>
      {/* Label */}
      <span style={{ fontSize: '11px', color: 'var(--forge-text-muted, #7A8291)', fontWeight: 500 }}>Simulation</span>

      {/* Play button */}
      <button style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'var(--forge-bg-elevated, #161920)',
        border: '1px solid var(--forge-border-default, #1E2230)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--forge-accent-primary, #00D4AA)',
      }}>
        <Play size={14} fill="currentColor" />
      </button>

      {/* Current time */}
      <span style={{ fontSize: '12px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-primary, #E8ECF1)' }}>{sim.currentTime}</span>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={100}
        defaultValue={sim.progress}
        style={{
          width: '120px',
          height: '4px',
          WebkitAppearance: 'none',
          appearance: 'none',
          background: `linear-gradient(to right, var(--forge-accent-primary, #00D4AA) ${sim.progress}%, var(--forge-bg-overlay, #1C1F28) ${sim.progress}%)`,
          borderRadius: '2px',
          outline: 'none',
          cursor: 'pointer',
        }}
      />

      {/* Total time */}
      <span style={{ fontSize: '12px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-primary, #E8ECF1)' }}>{sim.totalTime}</span>

      {/* Speed label */}
      <span style={{ fontSize: '10px', color: 'var(--forge-text-muted, #7A8291)', letterSpacing: '0.03em' }}>SPEED:</span>

      {/* Speed buttons */}
      <div style={{ display: 'flex', gap: '3px' }}>
        {sim.speeds.map(s => {
          const isActive = s === speed;
          return (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                padding: '3px 8px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 600,
                fontFamily: 'var(--forge-font-tech)',
                background: isActive ? 'var(--forge-accent-primary, #00D4AA)' : 'var(--forge-bg-elevated, #161920)',
                color: isActive ? '#08090C' : 'var(--forge-text-secondary, #9BA3B0)',
                transition: 'all 150ms',
              }}
            >{s}</button>
          );
        })}
      </div>
    </div>
  );
}
