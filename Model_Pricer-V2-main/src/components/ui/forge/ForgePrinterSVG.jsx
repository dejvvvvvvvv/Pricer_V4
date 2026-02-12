import React from 'react';

/**
 * Isometric 3D printer SVG with animated layer-building sequence.
 * 18-second animation cycle: build layers -> "READY" pause -> fade out -> loop.
 * Pure CSS animations — no JS timers, no extra dependencies.
 * Reference image: docs/claude/Images/ModelPricer-LOGO (1).png
 */
export default function ForgePrinterSVG({ className = '' }) {
  const dur = 18; // seconds
  const cx = 240; // center X
  const baseY = 300; // bottom of layer stack

  // 8 isometric layers stacked bottom-to-top
  const layerCount = 8;
  const lw = 52;  // iso half-width
  const ld = 15;  // iso half-depth (Y offset)
  const lh = 6;   // layer thickness
  const spacing = 10; // vertical gap between layers

  const layers = [];
  for (let i = 0; i < layerCount; i++) {
    const y = baseY - i * spacing;
    const startTime = 0.5 + i * 0.7; // staggered start in seconds
    const startPct = ((startTime / dur) * 100).toFixed(1);
    const endPct = (((startTime + 0.6) / dur) * 100).toFixed(1);
    const opBase = 0.15 + i * 0.05;

    layers.push({ y, startPct, endPct, opBase, pct: (i + 1) * 10 });
  }

  // Generate per-layer keyframes as embedded CSS
  const layerKeyframes = layers.map((l, i) => `
    @keyframes fp-layer-${i} {
      0%, ${l.startPct}% {
        opacity: 0;
        transform: scaleY(0) scaleX(0.7);
      }
      ${l.endPct}% {
        opacity: 1;
        transform: scaleY(1) scaleX(1);
      }
      83% {
        opacity: 1;
        transform: scaleY(1) scaleX(1);
      }
      89% {
        opacity: 0;
        transform: scaleY(0) scaleX(0.7);
      }
      100% {
        opacity: 0;
        transform: scaleY(0) scaleX(0.7);
      }
    }
  `).join('');

  // Isometric parallelogram path generators
  const topFace = (y) =>
    `M ${cx} ${y - lh} L ${cx + lw} ${y - lh + ld} L ${cx} ${y - lh + ld * 2} L ${cx - lw} ${y - lh + ld} Z`;
  const leftFace = (y) =>
    `M ${cx - lw} ${y - lh + ld} L ${cx} ${y - lh + ld * 2} L ${cx} ${y + ld * 2} L ${cx - lw} ${y + ld} Z`;
  const rightFace = (y) =>
    `M ${cx} ${y - lh + ld * 2} L ${cx + lw} ${y - lh + ld} L ${cx + lw} ${y + ld} L ${cx} ${y + ld * 2} Z`;

  return (
    <svg
      className={`w-[480px] h-[450px] ${className}`}
      viewBox="0 0 480 450"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Embedded keyframes for per-layer timing within 18s cycle */}
      <style>{layerKeyframes}</style>

      <defs>
        {/* Dot pattern background */}
        <pattern id="fp-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="0.7" fill="#1E2230" opacity="0.35" />
        </pattern>

        {/* Teal aura behind printed object */}
        <radialGradient id="fp-teal-aura" cx="50%" cy="60%" r="35%">
          <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#00D4AA" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
        </radialGradient>

        {/* Nozzle orange glow */}
        <radialGradient id="fp-nozzle-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF9F43" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#FF9F43" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FF9F43" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ===== BACKGROUND DOTS ===== */}
      <rect width="480" height="450" fill="url(#fp-dots)" opacity="0.5" />

      {/* ===== BASE PEDESTAL (isometric box) ===== */}
      {/* Top face */}
      <path
        d="M 100 360 L 240 395 L 380 360 L 240 325 Z"
        fill="#161920" stroke="#2A3040" strokeWidth="1"
      />
      {/* Front-left face */}
      <path
        d="M 100 360 L 240 395 L 240 420 L 100 385 Z"
        fill="#1A1E28" stroke="#2A3040" strokeWidth="0.8"
      />
      {/* Front-right face */}
      <path
        d="M 240 395 L 380 360 L 380 385 L 240 420 Z"
        fill="#141820" stroke="#2A3040" strokeWidth="0.8"
      />

      {/* LCD Display on front-left face */}
      <rect
        x="132" y="370" width="60" height="20" rx="2.5"
        fill="#0A0D12" stroke="#1E2230" strokeWidth="0.8"
      />
      <circle cx="139" cy="380" r="2" fill="#00D4AA" opacity="0.6" />
      {/* "PRINTING" text — visible during build phase */}
      <text
        x="146" y="384"
        fill="#00D4AA" fontSize="8"
        fontFamily="'Space Mono', monospace"
        letterSpacing="0.05em"
        style={{ animation: `forge-display-printing ${dur}s ease-in-out infinite` }}
      >
        PRINTING
      </text>
      {/* "READY" text — visible after build completes */}
      <text
        x="152" y="384"
        fill="#00D4AA" fontSize="8"
        fontFamily="'Space Mono', monospace"
        letterSpacing="0.05em"
        style={{ animation: `forge-display-ready ${dur}s ease-in-out infinite` }}
      >
        READY
      </text>

      {/* ===== FRAME — isometric pillar structure ===== */}
      {/* Back-left pillar */}
      <line x1="140" y1="118" x2="140" y2="343" stroke="#2A3040" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      {/* Back-right pillar */}
      <line x1="340" y1="118" x2="340" y2="343" stroke="#2A3040" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      {/* Front-left pillar */}
      <line x1="110" y1="143" x2="110" y2="368" stroke="#3A4555" strokeWidth="3" strokeLinecap="round" />
      {/* Front-right pillar */}
      <line x1="370" y1="143" x2="370" y2="368" stroke="#3A4555" strokeWidth="3" strokeLinecap="round" />

      {/* Top frame bars */}
      <line x1="110" y1="143" x2="370" y2="143" stroke="#3A4555" strokeWidth="2" />
      <line x1="140" y1="118" x2="340" y2="118" stroke="#2A3040" strokeWidth="1.5" opacity="0.45" />
      <line x1="110" y1="143" x2="140" y2="118" stroke="#2A3040" strokeWidth="1.5" opacity="0.55" />
      <line x1="370" y1="143" x2="340" y2="118" stroke="#2A3040" strokeWidth="1.5" opacity="0.55" />

      {/* Cross bracing on sides */}
      <line x1="110" y1="180" x2="140" y2="155" stroke="#1E2230" strokeWidth="0.8" opacity="0.35" />
      <line x1="110" y1="315" x2="140" y2="290" stroke="#1E2230" strokeWidth="0.8" opacity="0.35" />
      <line x1="370" y1="180" x2="340" y2="155" stroke="#1E2230" strokeWidth="0.8" opacity="0.35" />
      <line x1="370" y1="315" x2="340" y2="290" stroke="#1E2230" strokeWidth="0.8" opacity="0.35" />

      {/* Z-axis rails (dashed) */}
      <line x1="116" y1="153" x2="116" y2="355" stroke="#1E2230" strokeWidth="0.7" strokeDasharray="4 4" opacity="0.4" />
      <line x1="364" y1="153" x2="364" y2="355" stroke="#1E2230" strokeWidth="0.7" strokeDasharray="4 4" opacity="0.4" />

      {/* ===== FILAMENT GUIDE ARCH ===== */}
      <path
        d="M 340 128 C 325 88, 270 78, 242 115"
        stroke="#2A3040" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.45"
      />
      {/* Spool */}
      <circle cx="352" cy="112" r="13" fill="none" stroke="#2A3040" strokeWidth="1" opacity="0.5" />
      <circle cx="352" cy="112" r="5" fill="#161920" stroke="#1E2230" strokeWidth="0.8" opacity="0.5" />

      {/* ===== BUILD PLATE (isometric diamond) ===== */}
      <path
        d="M 240 316 L 298 342 L 240 358 L 182 342 Z"
        fill="#161920" stroke="#2A3040" strokeWidth="0.8" opacity="0.7"
      />

      {/* ===== TEAL AURA (animated glow behind layers) ===== */}
      <ellipse
        cx="240" cy="290" rx="75" ry="38"
        fill="url(#fp-teal-aura)"
        style={{ animation: `forge-teal-aura ${dur}s ease-in-out infinite` }}
      />

      {/* ===== PRINTED LAYERS (8 isometric layers, staggered build) ===== */}
      {layers.map((l, i) => (
        <g
          key={i}
          style={{
            transformOrigin: `${cx}px ${l.y}px`,
            animation: `fp-layer-${i} ${dur}s cubic-bezier(0.34, 1.56, 0.64, 1) infinite`,
          }}
        >
          {/* Top face (brightest) */}
          <path d={topFace(l.y)} fill="#00D4AA" opacity={l.opBase + 0.18} />
          {/* Front-left face */}
          <path d={leftFace(l.y)} fill="#00D4AA" opacity={l.opBase + 0.02} />
          {/* Front-right face (darkest) */}
          <path d={rightFace(l.y)} fill="#00D4AA" opacity={l.opBase - 0.02} />
          {/* Edge highlight on top */}
          <path d={topFace(l.y)} fill="none" stroke="#00D4AA" strokeWidth="0.5" opacity={l.opBase + 0.25} />
        </g>
      ))}

      {/* Percentage labels (right side) */}
      {layers.map((l, i) => (
        <text
          key={`pct-${i}`}
          x={cx + lw + 14}
          y={l.y + ld - 3}
          fill="#00D4AA"
          fontSize="7"
          fontFamily="'Space Mono', monospace"
          opacity="0"
          style={{
            animation: `fp-layer-${i} ${dur}s ease-in-out infinite`,
          }}
        >
          {l.pct}%
        </text>
      ))}

      {/* ===== NOZZLE ASSEMBLY ===== */}
      {/* X-axis gantry bar */}
      <line x1="118" y1="198" x2="362" y2="198" stroke="#3A4555" strokeWidth="1.8" />

      {/* Carriage block (isometric 3D box) */}
      <path d="M 228 188 L 252 188 L 258 192 L 234 192 Z" fill="#1E2230" stroke="#2A3040" strokeWidth="0.7" />
      <path d="M 228 188 L 228 204 L 234 208 L 234 192 Z" fill="#161920" stroke="#2A3040" strokeWidth="0.7" />
      <path d="M 234 192 L 258 192 L 258 208 L 234 208 Z" fill="#1A1E28" stroke="#2A3040" strokeWidth="0.7" />

      {/* Nozzle cone */}
      <path d="M 238 208 L 243 222 L 240 226 L 237 222 Z" fill="#3A4555" />
      <path d="M 238 222 L 240 228 L 242 222" fill="#FF9F43" opacity="0.85" />

      {/* Nozzle hot glow — pulsing continuously */}
      <circle cx="240" cy="228" r="22" fill="url(#fp-nozzle-glow)" className="forge-hot-glow" opacity="0.12" />
      <circle cx="240" cy="228" r="12" fill="url(#fp-nozzle-glow)" className="forge-hot-glow" opacity="0.28" />
      <circle cx="240" cy="228" r="5" fill="#FF9F43" className="forge-hot-glow" opacity="0.5" />

      {/* ===== SPIRAL FILAMENT (animated flow from nozzle down) ===== */}
      <path
        d="M 240 182
           C 252 192, 230 202, 242 212
           C 254 222, 232 232, 242 242
           C 252 252, 236 260, 240 268"
        stroke="#00D4AA"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="10 18"
        style={{
          animation: `forge-spiral-flow 1.8s linear infinite, forge-spiral-fade ${dur}s ease-in-out infinite`,
        }}
      />

      {/* ===== CORNER BRACKETS (decorative) ===== */}
      <g stroke="#5C6370" strokeWidth="0.8" opacity="0.4">
        <path d="M 94 138 L 94 152" />
        <path d="M 94 138 L 108 138" />
        <path d="M 386 138 L 386 152" />
        <path d="M 372 138 L 386 138" />
        <path d="M 94 382 L 94 368" />
        <path d="M 94 382 L 108 382" />
        <path d="M 386 382 L 386 368" />
        <path d="M 372 382 L 386 382" />
      </g>
    </svg>
  );
}
