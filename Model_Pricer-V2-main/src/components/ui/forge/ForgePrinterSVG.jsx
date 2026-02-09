import React from 'react';

export default function ForgePrinterSVG({ className = '' }) {
  return (
    <svg
      className={`w-[420px] h-[380px] ${className}`}
      viewBox="0 0 420 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background glow */}
      <defs>
        <radialGradient id="layerGlow" cx="50%" cy="70%" r="40%">
          <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A3040" />
          <stop offset="100%" stopColor="#1E2230" />
        </linearGradient>
      </defs>

      {/* Glow behind print area */}
      <ellipse cx="210" cy="260" rx="120" ry="60" fill="url(#layerGlow)" />

      {/* === FRAME — isometric 3D printer structure === */}
      {/* Base frame */}
      <rect x="70" y="40" width="280" height="300" rx="4"
        stroke="#2A3040" strokeWidth="1.5" fill="none" />

      {/* Top bar */}
      <line x1="70" y1="40" x2="350" y2="40" stroke="#2A3040" strokeWidth="2" />

      {/* Vertical columns */}
      <line x1="90" y1="40" x2="90" y2="340" stroke="#2A3040" strokeWidth="2.5" />
      <line x1="330" y1="40" x2="330" y2="340" stroke="#2A3040" strokeWidth="2.5" />

      {/* Cross braces */}
      <line x1="90" y1="70" x2="330" y2="70" stroke="#1E2230" strokeWidth="1" />

      {/* === Z-AXIS RAILS === */}
      <line x1="95" y1="50" x2="95" y2="330" stroke="#1E2230" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="325" y1="50" x2="325" y2="330" stroke="#1E2230" strokeWidth="1" strokeDasharray="4 4" />

      {/* === NOZZLE ASSEMBLY (animated) === */}
      <g className="forge-nozzle-move">
        {/* X-axis bar */}
        <line x1="100" y1="140" x2="320" y2="140" stroke="#2A3040" strokeWidth="2" />

        {/* Carriage block */}
        <rect x="170" y="128" width="50" height="24" rx="3"
          fill="#161920" stroke="#2A3040" strokeWidth="1.5" />

        {/* Nozzle tip */}
        <path d="M190 152 L195 168 L200 152" fill="#FF9F43" />

        {/* Nozzle hot glow */}
        <circle cx="195" cy="168" r="5" fill="#FF9F43" opacity="0.5" className="forge-hot-glow" />
        <circle cx="195" cy="168" r="10" fill="#FF9F43" opacity="0.15" className="forge-hot-glow" />

        {/* Filament path */}
        <line x1="195" y1="70" x2="195" y2="128" stroke="#00D4AA" strokeWidth="1" opacity="0.3" />
      </g>

      {/* === SPOOL (top right) === */}
      <circle cx="300" cy="55" r="18" fill="none" stroke="#2A3040" strokeWidth="1.5" />
      <circle cx="300" cy="55" r="8" fill="#161920" stroke="#1E2230" strokeWidth="1" />

      {/* === BUILD PLATE === */}
      <rect x="110" y="300" width="200" height="10" rx="2"
        fill="#161920" stroke="#2A3040" strokeWidth="1" />

      {/* Build plate grid */}
      {[130, 150, 170, 190, 210, 230, 250, 270, 290].map((x) => (
        <line key={x} x1={x} y1="300" x2={x} y2="310"
          stroke="#1E2230" strokeWidth="0.5" />
      ))}

      {/* === PRINTED LAYERS (animated, teal glow) === */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect
          key={i}
          x="150"
          y={292 - i * 8}
          width="120"
          height="6"
          rx="1"
          fill="#00D4AA"
          opacity={0.12 + i * 0.09}
          style={{
            animation: `forge-layer-appear 600ms ${i * 700}ms ease-out both`,
          }}
        />
      ))}

      {/* === LCD DISPLAY === */}
      <rect x="95" y="50" width="55" height="28" rx="3"
        fill="#0E1015" stroke="#1E2230" strokeWidth="1" />
      <text x="102" y="68"
        fill="#00D4AA"
        fontSize="9"
        fontFamily="'Space Mono', monospace"
        letterSpacing="0.05em"
      >
        READY
      </text>

      {/* === DECORATIVE DETAILS === */}
      {/* Corner brackets */}
      <path d="M75 45 L75 55" stroke="#5C6370" strokeWidth="1" />
      <path d="M75 45 L85 45" stroke="#5C6370" strokeWidth="1" />
      <path d="M345 45 L345 55" stroke="#5C6370" strokeWidth="1" />
      <path d="M335 45 L345 45" stroke="#5C6370" strokeWidth="1" />
      <path d="M75 335 L75 325" stroke="#5C6370" strokeWidth="1" />
      <path d="M75 335 L85 335" stroke="#5C6370" strokeWidth="1" />
      <path d="M345 335 L345 325" stroke="#5C6370" strokeWidth="1" />
      <path d="M335 335 L345 335" stroke="#5C6370" strokeWidth="1" />
    </svg>
  );
}
