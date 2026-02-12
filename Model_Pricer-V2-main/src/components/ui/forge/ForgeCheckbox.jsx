import React, { useId } from 'react';

/**
 * Forge-themed animated checkbox with smooth checkmark draw + scale pop.
 *
 * @param {boolean} checked
 * @param {Function} onChange - receives the native event
 * @param {boolean} [disabled]
 * @param {string} [label] - optional text label
 * @param {number} [size=20] - box size in px
 * @param {object} [style] - extra wrapper styles
 */
export default function ForgeCheckbox({
  checked,
  onChange,
  disabled,
  label,
  size = 20,
  style,
}) {
  const uid = useId();

  const wrapStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    opacity: disabled ? 0.4 : 1,
    ...style,
  };

  const hiddenInput = {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
    pointerEvents: 'none',
  };

  const boxStyle = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: '5px',
    border: checked
      ? '2px solid var(--forge-accent-primary)'
      : '2px solid var(--forge-border-active)',
    background: checked ? 'var(--forge-accent-primary)' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition:
      'background 200ms cubic-bezier(0.16,1,0.3,1), border-color 200ms cubic-bezier(0.16,1,0.3,1), transform 200ms cubic-bezier(0.34,1.56,0.64,1)',
    transform: checked ? 'scale(1)' : 'scale(1)',
    flexShrink: 0,
  };

  const svgSize = Math.round(size * 0.65);

  const labelStyle = {
    fontFamily: 'var(--forge-font-body)',
    color: 'var(--forge-text-primary)',
    fontSize: '14px',
    lineHeight: 1.4,
  };

  return (
    <label htmlFor={uid} style={wrapStyle}>
      <input
        id={uid}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={hiddenInput}
      />
      <span
        className={`fcb-box${checked ? ' fcb-checked' : ''}`}
        style={boxStyle}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 14 14"
          fill="none"
          style={{ overflow: 'visible' }}
        >
          <path
            className="fcb-path"
            d="M2.5 7.2L5.7 10.2L11.5 3.8"
            stroke="var(--forge-bg-void)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 20,
              strokeDashoffset: checked ? 0 : 20,
              transition: 'stroke-dashoffset 280ms cubic-bezier(0.65,0,0.35,1) 50ms',
            }}
          />
        </svg>
      </span>
      {label && <span style={labelStyle}>{label}</span>}

      <style>{`
        .fcb-checked {
          animation: fcb-pop 350ms cubic-bezier(0.34,1.56,0.64,1);
        }
        .fcb-box:hover {
          border-color: var(--forge-accent-primary) !important;
        }
        @keyframes fcb-pop {
          0% { transform: scale(0.85); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
      `}</style>
    </label>
  );
}
