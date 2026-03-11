import React, { useState, useRef, useCallback, useEffect } from 'react';

/* ── Constants ────────────────────────────────────────────────────────────── */
const MIN_QTY = 1;
const MAX_QTY = 9999;
const PRESETS = [1, 5, 10, 25, 50, 100];

// Long-press timing: starts slow, accelerates
const INITIAL_DELAY = 400;   // ms before first repeat
const FAST_INTERVAL = 80;    // ms between fast repeats
const ACCEL_THRESHOLD = 8;   // repeats before switching to fast mode

/* ── Forge-aligned styles ─────────────────────────────────────────────────── */
const s = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  label: {
    fontSize: '12px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    color: 'var(--forge-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  stepperRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
  },
  btn: (side) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.75rem',
    height: '2.75rem',
    border: '1px solid var(--forge-border-default)',
    background: 'var(--forge-bg-elevated)',
    color: 'var(--forge-accent-primary)',
    cursor: 'pointer',
    fontSize: '1.25rem',
    fontWeight: 700,
    fontFamily: 'var(--forge-font-mono)',
    transition: 'background 0.12s, border-color 0.12s',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    borderRadius: side === 'left'
      ? 'var(--forge-radius-md) 0 0 var(--forge-radius-md)'
      : '0 var(--forge-radius-md) var(--forge-radius-md) 0',
    ...(side === 'left' ? { borderRight: 'none' } : { borderLeft: 'none' }),
    minHeight: '44px',
  }),
  btnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
    color: 'var(--forge-text-muted)',
  },
  display: (editing) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '4.5rem',
    height: '2.75rem',
    border: '1px solid var(--forge-border-default)',
    borderLeft: 'none',
    borderRight: 'none',
    background: editing ? 'var(--forge-bg-surface)' : 'var(--forge-bg-elevated)',
    fontFamily: 'var(--forge-font-mono)',
    fontWeight: 700,
    fontSize: 'var(--forge-text-lg)',
    color: 'var(--forge-text-primary)',
    cursor: editing ? 'text' : 'pointer',
    transition: 'background 0.12s',
    padding: '0 0.25rem',
    minHeight: '44px',
  }),
  input: {
    width: '100%',
    textAlign: 'center',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: 'var(--forge-font-mono)',
    fontWeight: 700,
    fontSize: 'var(--forge-text-lg)',
    color: 'var(--forge-text-primary)',
    padding: 0,
  },
  unit: {
    marginLeft: '0.5rem',
    fontSize: 'var(--forge-text-sm)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 400,
    alignSelf: 'center',
  },
  presetsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
  },
  chip: (active) => ({
    padding: '0.25rem 0.625rem',
    borderRadius: '999px',
    fontSize: '12px',
    fontFamily: 'var(--forge-font-mono)',
    fontWeight: 600,
    border: active
      ? '1px solid var(--forge-accent-primary)'
      : '1px solid var(--forge-border-default)',
    background: active
      ? 'rgba(0, 212, 170, 0.12)'
      : 'var(--forge-bg-elevated)',
    color: active
      ? 'var(--forge-accent-primary)'
      : 'var(--forge-text-muted)',
    cursor: 'pointer',
    transition: 'all 0.12s',
    minHeight: '28px',
    display: 'inline-flex',
    alignItems: 'center',
  }),
  hint: {
    fontSize: 'var(--forge-text-xs)',
    color: 'var(--forge-text-muted)',
    fontFamily: 'var(--forge-font-mono)',
    lineHeight: 1.4,
  },
  pulseKeyframes: `
    @keyframes qs-pulse {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.08); }
      100% { transform: scale(1); }
    }
  `,
};

/**
 * QuantityStepper — enhanced quantity selector with stepper, presets, long-press.
 *
 * Props:
 *   value        — current quantity (number)
 *   onChange      — (newValue: number) => void
 *   min          — minimum (default 1)
 *   max          — maximum (default 9999)
 *   unitPrice    — optional per-unit price for batch hint
 *   currency     — currency label (default "Kc")
 *   disabled     — disable all controls
 *   label        — label text (default "Pocet kusu")
 */
const QuantityStepper = ({
  value = 1,
  onChange,
  min = MIN_QTY,
  max = MAX_QTY,
  unitPrice = null,
  currency = 'Kc',
  disabled = false,
  label = 'POCET KUSU',
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [pulse, setPulse] = useState(false);
  const inputRef = useRef(null);

  // Long-press refs
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const repeatCountRef = useRef(0);

  const clamp = useCallback(
    (v) => Math.max(min, Math.min(max, v)),
    [min, max]
  );

  const safeValue = clamp(
    Number.isFinite(Number(value)) ? Number(value) : min
  );

  // Trigger brief pulse animation on value change
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 200);
    return () => clearTimeout(t);
  }, [safeValue]);

  /* ── Increment / Decrement ─────────────────────────────────────────── */
  const step = useCallback(
    (delta) => {
      if (disabled) return;
      const next = clamp(safeValue + delta);
      if (next !== safeValue) {
        onChange?.(next);
      }
    },
    [disabled, safeValue, clamp, onChange]
  );

  /* ── Long press logic ──────────────────────────────────────────────── */
  const clearLongPress = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    repeatCountRef.current = 0;
  }, []);

  const startLongPress = useCallback(
    (delta) => {
      if (disabled) return;
      // Immediate first step
      step(delta);
      repeatCountRef.current = 0;

      timeoutRef.current = setTimeout(() => {
        // Start repeating
        intervalRef.current = setInterval(() => {
          repeatCountRef.current += 1;
          // Accelerate: after threshold, step by larger amounts
          const bigDelta =
            repeatCountRef.current > ACCEL_THRESHOLD * 2
              ? delta * 10
              : repeatCountRef.current > ACCEL_THRESHOLD
              ? delta * 5
              : delta;
          step(bigDelta);
        }, FAST_INTERVAL);
      }, INITIAL_DELAY);
    },
    [disabled, step]
  );

  // Clean up on unmount
  useEffect(() => clearLongPress, [clearLongPress]);

  /* ── Pointer handlers (work for mouse + touch) ─────────────────────── */
  const handlePointerDown = useCallback(
    (delta) => (e) => {
      e.preventDefault();
      startLongPress(delta);
    },
    [startLongPress]
  );

  const handlePointerUpOrLeave = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  /* ── Direct input editing ──────────────────────────────────────────── */
  const startEditing = useCallback(() => {
    if (disabled) return;
    setEditing(true);
    setEditValue(String(safeValue));
  }, [disabled, safeValue]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    const parsed = parseInt(editValue, 10);
    if (Number.isFinite(parsed) && parsed >= min) {
      onChange?.(clamp(parsed));
    }
    // else revert silently
  }, [editValue, min, clamp, onChange]);

  const handleEditKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        commitEdit();
      } else if (e.key === 'Escape') {
        setEditing(false);
      }
    },
    [commitEdit]
  );

  /* ── Keyboard arrows on stepper container ──────────────────────────── */
  const handleKeyDown = useCallback(
    (e) => {
      if (editing) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      }
    },
    [editing, step]
  );

  /* ── Batch pricing hint ────────────────────────────────────────────── */
  const renderHint = () => {
    if (unitPrice == null || !Number.isFinite(unitPrice) || unitPrice <= 0) return null;
    const total = Math.round(unitPrice * safeValue);
    const perPiece = Math.round(unitPrice);
    if (safeValue <= 1) return null;
    return (
      <div style={s.hint}>
        1 ks: {perPiece} {currency} | {safeValue} ks: {total} {currency}
      </div>
    );
  };

  const atMin = safeValue <= min;
  const atMax = safeValue >= max;

  return (
    <div style={s.wrapper}>
      <style>{s.pulseKeyframes}</style>

      {label && <label style={s.label}>{label}</label>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Stepper group */}
        <div
          style={s.stepperRow}
          role="group"
          aria-label={label || 'Quantity stepper'}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {/* Minus button */}
          <button
            type="button"
            style={{
              ...s.btn('left'),
              ...(atMin || disabled ? s.btnDisabled : {}),
            }}
            disabled={atMin || disabled}
            aria-label="Snizit pocet"
            onPointerDown={handlePointerDown(-1)}
            onPointerUp={handlePointerUpOrLeave}
            onPointerLeave={handlePointerUpOrLeave}
            onContextMenu={(e) => e.preventDefault()}
          >
            &minus;
          </button>

          {/* Value display / input */}
          <div
            style={s.display(editing)}
            onClick={startEditing}
            aria-live="polite"
          >
            {editing ? (
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                style={s.input}
                value={editValue}
                onChange={(e) => {
                  // Allow only digits
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  setEditValue(v);
                }}
                onBlur={commitEdit}
                onKeyDown={handleEditKeyDown}
                aria-label="Zadat pocet kusu"
              />
            ) : (
              <span
                style={{
                  animation: pulse ? 'qs-pulse 0.2s ease-out' : 'none',
                  display: 'inline-block',
                }}
              >
                {safeValue}
              </span>
            )}
          </div>

          {/* Plus button */}
          <button
            type="button"
            style={{
              ...s.btn('right'),
              ...(atMax || disabled ? s.btnDisabled : {}),
            }}
            disabled={atMax || disabled}
            aria-label="Zvysit pocet"
            onPointerDown={handlePointerDown(1)}
            onPointerUp={handlePointerUpOrLeave}
            onPointerLeave={handlePointerUpOrLeave}
            onContextMenu={(e) => e.preventDefault()}
          >
            +
          </button>
        </div>

        <span style={s.unit}>ks</span>
      </div>

      {/* Quick presets */}
      <div style={s.presetsRow} role="group" aria-label="Rychle predvolby poctu">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            style={s.chip(safeValue === preset)}
            onClick={() => {
              if (!disabled) onChange?.(clamp(preset));
            }}
            disabled={disabled}
            aria-label={`${preset} kusu`}
            aria-pressed={safeValue === preset}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Batch pricing hint */}
      {renderHint()}
    </div>
  );
};

export default QuantityStepper;
